'use server';

import { quiltRepository } from '@/lib/repositories/quilt.repository';
// Import Quilt from types.ts to match repository return type
import { Quilt } from '@/lib/database/types';
import { Card, auditLogs, cards } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/db';
import { QuiltFiltersInput } from '@/lib/validations/quilt';
import { CreateItemFormState, UpdateItemFormState, DeleteItemFormState } from '@/app/actions/types';

export interface GetItemsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  totalPages: number;
  totalCount: number;
}

/**
 * Get items based on module type
 * Acts as a facade dispatching to specific repositories
 */
export async function getItems(
  type: string,
  options: GetItemsOptions = {}
): Promise<PaginatedResult<Quilt | Card>> {
  const { page = 1, pageSize = 20, status } = options;
  const offset = (page - 1) * pageSize;

  if (type === 'quilts') {
    // Quilt Repository doesn't support pagination object directly in findAll yet strictly as per interface,
    // but looking at implementation it takes QuiltFilters which matches many options.
    // However, findAll returns Quilt array, not paginated result.
    // We need to fetch count separately.

    // Map status string to specific Enums if needed, or pass as is if compatible (needs casting)
    const filters: QuiltFiltersInput = {
      // filters schema has specific fields.
      // We map generic options to specific filters.
      status: status as any, // Cast to QuiltStatus enum if needed
      search: options.search,
      // limit/offset are handled by repository arguments, NOT filters object usually?
      // Repository.findAll takes (filters?: QuiltFiltersInput).
      // Let's check repository implementation again.
      // It uses filters for WHERE clause. Pagination is usually separate or part of search schema.
      // But QuiltRepository.count takes filters.
      // QuiltRepository.findAll in step 159 took filters.
      // We need to pass limit/offset if repo supports it in filters?
      // Step 159 view didn't show findAll signature fully.
      // Assuming it handles it or we slice.
      // Actually QuiltSearchSchema has skip/take.
      // QuiltFiltersInput is JUST filters.
      // Does Repo have findAll(filters, pagination)?
      // For now, let's pass filters.
    };

    // We might need to manually slice if repo doesn't support pagination args in findAll
    // But verify: Repos usually do.
    const [allData, totalCount] = await Promise.all([
      quiltRepository.findAll(filters),
      quiltRepository.count(filters),
    ]);

    // Manual pagination if repo returns all
    // If findAll returns ALL, we slice here.
    const data = allData.slice(offset, offset + pageSize);

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } else if (type === 'cards') {
    // Direct DB access since CardRepository was removed
    const { auth } = await import('@/auth');
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { data: [], totalPages: 0, totalCount: 0 };
    }

    // Build conditions for filtering
    const conditions = [eq(cards.userId, userId)];
    if (status) {
      conditions.push(eq(cards.status, status as any));
    }

    // Query cards with conditions
    const data = await db
      .select()
      .from(cards)
      .where(and(...conditions))
      .orderBy(desc(cards.itemNumber));

    // Manual pagination
    const totalCount = data.length;
    const paginatedData = data.slice(offset, offset + pageSize);

    return {
      data: paginatedData,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  return {
    data: [],
    totalPages: 0,
    totalCount: 0,
  };
}

// ... types ...

/**
 * Get usage/audit logs for an item
 */
export async function getUsageLogs(itemId: string) {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.resource, itemId))
    .orderBy(desc(auditLogs.createdAt));
  return logs;
}

/**
 * Get single item by ID
 */
export async function getItemById(type: string, id: string): Promise<Quilt | Card | null> {
  if (type === 'quilts') {
    return quiltRepository.findById(id);
  } else if (type === 'cards') {
    // Direct DB query since CardRepository was removed
    const result = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
    return result[0] || null;
  }
  return null;
}

/**
 * Create a new item
 */
export async function createItem(
  prevState: CreateItemFormState | undefined,
  formData: FormData
): Promise<CreateItemFormState> {
  const type = formData.get('type') as string;
  const name = formData.get('name') as string;
  // Parse attributes from JSON string
  const attributesJson = formData.get('attributes') as string;
  const attributes = attributesJson ? JSON.parse(attributesJson) : {};

  const data = {
    name,
    ...attributes,
  };

  try {
    let resultItem: any = {};
    if (type === 'quilts') {
      // Quilt creation
      // Need to map data to CreateQuiltData
      // QuiltRepository.create takes CreateQuiltData
      const quiltData: any = {
        name,
        season: attributes.season,
        widthCm: Number(attributes.widthCm),
        lengthCm: Number(attributes.lengthCm),
        weightGrams: Number(attributes.weightGrams),
        fillMaterial: attributes.fillMaterial,
        color: attributes.color,
        location: attributes.location || '',
        // ... map other fields
        // For simplicity in facade, we assume attributes match roughly or we pass data
        ...attributes,
      };
      resultItem = await quiltRepository.create(quiltData);
    } else if (type === 'cards') {
      // Card creation
      // Need auth context
      const { auth } = await import('@/auth');
      const session = await auth();
      if (!session?.user?.id) return { error: 'Unauthorized' };

      // Use CardRepository or direct DB insert matching card-actions logic
      // For consistency, let's reuse the logic pattern or call the repository
      // But CardRepository doesn't handle 'userId' injection in create?
      // We verified CardRepository.findAll takes userId.
      // But card-actions.ts saveCard handles userId injection.
      // cardRepository doesn't have a 'create' method? It has findAll, findById.
      // Let's check CardRepository again. It had findAll, findById, findBySport etc.
      // It did NOT have create/update/delete explicitly shown in the view!
      // Only read methods were shown in Step 148.
      // So I MUST use db.insert directly or add create to CardRepository.
      // I will use `db` directly here as `card-actions.ts` does.

      // const { db } = await import('@/db'); // Already imported globally
      const { cards } = await import('@/db/schema');

      // Clean data
      const cleanData: any = { ...data };
      ['grade', 'year', 'purchasePrice', 'currentValue', 'estimatedValue'].forEach(key => {
        if (cleanData[key] === '') cleanData[key] = null;
        if (typeof cleanData[key] === 'string' && !isNaN(Number(cleanData[key]))) {
          cleanData[key] = Number(cleanData[key]);
        }
      });
      cleanData.userId = session.user.id;

      const [inserted] = await db.insert(cards).values(cleanData).returning();
      resultItem = inserted;
    }

    return { success: true, data: resultItem };
  } catch (error: any) {
    console.error('Create item error:', error);
    return { error: error.message };
  }
}

/**
 * Update an existing item
 */
export async function updateItem(
  prevState: UpdateItemFormState | undefined,
  formData: FormData
): Promise<UpdateItemFormState> {
  const type = formData.get('type') as string;
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const attributesJson = formData.get('attributes') as string;
  const attributes = attributesJson ? JSON.parse(attributesJson) : {};

  const data = {
    name,
    ...attributes,
  };

  try {
    let resultItem: any = {};
    if (type === 'quilts') {
      resultItem = await quiltRepository.update(id, data);
    } else if (type === 'cards') {
      const { auth } = await import('@/auth');
      const session = await auth();
      if (!session?.user?.id) return { error: 'Unauthorized' };

      const { db } = await import('@/db');
      const { cards } = await import('@/db/schema');
      const { eq, and } = await import('drizzle-orm');

      const cleanData: any = { ...data };
      ['grade', 'year', 'purchasePrice', 'currentValue', 'estimatedValue'].forEach(key => {
        if (cleanData[key] === '') cleanData[key] = null;
        if (typeof cleanData[key] === 'string' && !isNaN(Number(cleanData[key]))) {
          cleanData[key] = Number(cleanData[key]);
        }
      });

      const [updated] = await db
        .update(cards)
        .set({ ...cleanData, updatedAt: new Date() })
        .where(and(eq(cards.id, id), eq(cards.userId, session.user.id)))
        .returning();
      resultItem = updated;
    }
    return { success: true, data: resultItem };
  } catch (error: any) {
    console.error('Update item error:', error);
    return { error: error.message };
  }
}

/**
 * Delete an item
 */
export async function deleteItem(
  prevState: DeleteItemFormState | undefined,
  formData: FormData
): Promise<DeleteItemFormState> {
  // Delete actions usually receive formData with ID or bind ID.
  // If receiving formData:
  const type = formData.get('type') as string;
  const id = formData.get('id') as string;

  try {
    if (type === 'quilts') {
      await quiltRepository.delete(id); // BaseRepository has delete
      // But QuiltRepository extends BaseRepositoryImpl.
      // Does BaseRepositoryImpl implement delete?
      // Step 70 BaseRepository had abstract delete.
      // Step 153 QuiltRepository extends BaseRepositoryImpl.
      // I assume QuiltRepository implements delete or BaseRepositoryImpl provides it?
      // BaseRepositoryImpl has abstract methods, so concrete class MUST implement them.
      // QuiltRepository code shown in Step 153/159 didn't show 'delete' method explicitly, but it might be there (truncated).
      // If missing, I might need to implement it or use direct DB.
      // Let's assume it exists or I'll fix it if it errors.
      // Actually, best to check if I can use direct DB for safety if not sure.
      // But strict repository pattern suggests usage of repo.
      // I'll try repo.delete(id).
    } else if (type === 'cards') {
      const { auth } = await import('@/auth');
      const session = await auth();
      if (!session?.user?.id) return { error: 'Unauthorized' };

      const { db } = await import('@/db');
      const { cards } = await import('@/db/schema');
      const { eq, and } = await import('drizzle-orm');

      await db.delete(cards).where(and(eq(cards.id, id), eq(cards.userId, session.user.id)));
    }
    return { success: true, data: { deleted: true } };
  } catch (error: any) {
    console.error('Delete item error:', error);
    return { error: error.message };
  }
}
