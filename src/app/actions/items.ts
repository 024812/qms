'use server';

import {
  countQuilts,
  createQuilt,
  deleteQuilt,
  getQuiltById,
  getQuilts,
  updateQuilt,
} from '@/lib/data/quilts';
import { Quilt } from '@/lib/database/types';
import { Card, auditLogs, cards } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/db';
import { QuiltStatus } from '@/lib/validations/quilt';
import {
  CreateItemFormState,
  DeleteItemFormState,
  ItemData,
  UpdateItemFormState,
} from '@/app/actions/types';

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

type JsonObject = Record<string, unknown>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
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
    const filters = {
      ...(status ? { status: status as QuiltStatus } : {}),
      ...(options.search ? { search: options.search } : {}),
      limit: pageSize,
      offset,
      sortBy: 'itemNumber' as const,
      sortOrder: 'asc' as const,
    };

    const [data, totalCount] = await Promise.all([getQuilts(filters), countQuilts(filters)]);

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
      conditions.push(eq(cards.status, status as Card['status']));
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
    return getQuiltById(id);
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
  const attributesJson = formData.get('attributes') as string;
  const attributes: JsonObject = attributesJson ? (JSON.parse(attributesJson) as JsonObject) : {};

  const data = {
    name,
    ...attributes,
  };

  try {
    let resultItem: unknown = {};
    if (type === 'quilts') {
      const quiltData: Parameters<typeof createQuilt>[0] = {
        name,
        season: attributes.season as Parameters<typeof createQuilt>[0]['season'],
        widthCm: Number(attributes.widthCm),
        lengthCm: Number(attributes.lengthCm),
        weightGrams: Number(attributes.weightGrams),
        fillMaterial: String(attributes.fillMaterial ?? ''),
        color: String(attributes.color ?? ''),
        location: String(attributes.location ?? ''),
        materialDetails: attributes.materialDetails as string | null | undefined,
        brand: attributes.brand as string | null | undefined,
        purchaseDate: attributes.purchaseDate as Date | null | undefined,
        packagingInfo: attributes.packagingInfo as string | null | undefined,
        currentStatus: attributes.currentStatus as Parameters<
          typeof createQuilt
        >[0]['currentStatus'],
        notes: attributes.notes as string | null | undefined,
        imageUrl: attributes.imageUrl as string | null | undefined,
        thumbnailUrl: attributes.thumbnailUrl as string | null | undefined,
        mainImage: attributes.mainImage as string | null | undefined,
        attachmentImages: attributes.attachmentImages as string[] | null | undefined,
      };
      resultItem = await createQuilt(quiltData);
    } else if (type === 'cards') {
      const { auth } = await import('@/auth');
      const session = await auth();
      if (!session?.user?.id) return { error: 'Unauthorized' };

      const { cards } = await import('@/db/schema');

      const cleanData: Partial<typeof cards.$inferInsert> & JsonObject = { ...data };
      ['grade', 'year', 'purchasePrice', 'currentValue', 'estimatedValue'].forEach(key => {
        if (cleanData[key] === '') cleanData[key] = null;
        if (typeof cleanData[key] === 'string' && !isNaN(Number(cleanData[key]))) {
          cleanData[key] = Number(cleanData[key]);
        }
      });
      cleanData.userId = session.user.id;

      const [inserted] = await db
        .insert(cards)
        .values(cleanData as typeof cards.$inferInsert)
        .returning();
      resultItem = inserted;
    }

    return { success: true, data: resultItem as ItemData };
  } catch (error: unknown) {
    console.error('Create item error:', error);
    return { error: getErrorMessage(error) };
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
  const attributes: JsonObject = attributesJson ? (JSON.parse(attributesJson) as JsonObject) : {};

  const data = {
    name,
    ...attributes,
  };

  try {
    let resultItem: unknown = {};
    if (type === 'quilts') {
      resultItem = await updateQuilt(id, data as Parameters<typeof updateQuilt>[1]);
    } else if (type === 'cards') {
      const { auth } = await import('@/auth');
      const session = await auth();
      if (!session?.user?.id) return { error: 'Unauthorized' };

      const { db } = await import('@/db');
      const { cards } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      const cleanData: Partial<typeof cards.$inferInsert> & JsonObject = { ...data };
      ['grade', 'year', 'purchasePrice', 'currentValue', 'estimatedValue'].forEach(key => {
        if (cleanData[key] === '') cleanData[key] = null;
        if (typeof cleanData[key] === 'string' && !isNaN(Number(cleanData[key]))) {
          cleanData[key] = Number(cleanData[key]);
        }
      });

      const [updated] = await db
        .update(cards)
        .set({ ...(cleanData as typeof cards.$inferInsert), updatedAt: new Date() })
        .where(and(eq(cards.id, id), eq(cards.userId, session.user.id)))
        .returning();
      resultItem = updated;
    }
    return { success: true, data: resultItem as ItemData };
  } catch (error: unknown) {
    console.error('Update item error:', error);
    return { error: getErrorMessage(error) };
  }
}

/**
 * Delete an item
 */
export async function deleteItem(
  prevState: DeleteItemFormState | undefined,
  formData: FormData
): Promise<DeleteItemFormState> {
  const type = formData.get('type') as string;
  const id = formData.get('id') as string;

  try {
    if (type === 'quilts') {
      await deleteQuilt(id);
    } else if (type === 'cards') {
      const { auth } = await import('@/auth');
      const session = await auth();
      if (!session?.user?.id) return { error: 'Unauthorized' };

      const { db } = await import('@/db');
      const { cards } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      await db.delete(cards).where(eq(cards.id, id));
    }
    return { success: true, data: { deleted: true } };
  } catch (error: unknown) {
    console.error('Delete item error:', error);
    return { error: getErrorMessage(error) };
  }
}
