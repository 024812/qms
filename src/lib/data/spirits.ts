/**
 * Spirits Data Access Layer
 *
 * Canonical data layer for spirits module following V3 API-first blueprint.
 * Uses Next.js 16 'use cache' directive for persistent caching.
 *
 * Architecture:
 * - Standalone async functions (not classes)
 * - 'use cache' directive for persistent caching
 * - Serializable data only (no class instances, no undefined)
 * - Cache invalidation with revalidateTag(, 'max')
 *
 * Cache Strategy:
 * - Individual items: 5 minutes
 * - Lists: 2 minutes (120 seconds)
 * - Tags: 'spirits', 'spirits:item:{id}', 'spirits:status:{status}', 'spirits:type:{type}'
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { spirits } from '@/db/schema';
import { eq, sql, desc, and, like, or } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { spiritsCacheTags } from '@/modules/core/cache-tags';
import type {
  Spirit,
  SpiritType,
  SpiritStatus,
  BottleStatus,
  CreateSpiritInput,
  UpdateSpiritInput,
} from '@/modules/spirits/schema';

// ============================================================================
// Types
// ============================================================================

export type SpiritSortField =
  'itemNumber' | 'name' | 'spiritType' | 'vintage' | 'age' | 'createdAt' | 'updatedAt';

export type SortOrder = 'asc' | 'desc';

export interface SpiritFilters {
  spiritType?: SpiritType;
  status?: SpiritStatus;
  bottleStatus?: BottleStatus;
  brand?: string;
  country?: string;
  region?: string;
  limitedEdition?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: SpiritSortField;
  sortOrder?: SortOrder;
}

// ============================================================================
// Helper Functions
// ============================================================================

function logSpiritDataError(message: string, error: unknown, meta?: Record<string, unknown>) {
  if (error instanceof Error) {
    dbLogger.error(message, error, meta);
    return;
  }

  dbLogger.error(message, undefined, {
    ...meta,
    ...(error !== undefined ? { error } : {}),
  });
}

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get spirit by ID
 *
 * Cache: 5 minutes
 * Tags: 'spirits', 'spirits:item:{id}'
 */
export async function getSpiritById(id: string): Promise<Spirit | null> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag(spiritsCacheTags.root, spiritsCacheTags.item(id));

  try {
    const result = await db.select().from(spirits).where(eq(spirits.id, id));

    if (!result[0]) return null;

    const row = result[0];
    return {
      ...row,
      abv: row.abv ? Number(row.abv) : null,
      purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
      currentValue: row.currentValue ? Number(row.currentValue) : null,
      estimatedValue: row.estimatedValue ? Number(row.estimatedValue) : null,
      bottlingDate: row.bottlingDate ?? null,
      acquiredDate: row.acquiredDate ?? null,
      attachmentImages: row.attachmentImages ?? null,
    } as Spirit;
  } catch (error) {
    logSpiritDataError('Error fetching spirit by ID', error, { id });
    throw error;
  }
}

/**
 * Get all spirits with filters
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'spirits', 'spirits:list', plus dynamic tags based on filters
 */
export async function getSpirits(filters: SpiritFilters = {}): Promise<Spirit[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)

  // Build cache tags based on filters
  const tags = [spiritsCacheTags.root, spiritsCacheTags.list];
  if (filters.status) tags.push(spiritsCacheTags.slice('status', filters.status));
  if (filters.spiritType) tags.push(spiritsCacheTags.slice('spiritType', filters.spiritType));
  if (filters.bottleStatus) tags.push(spiritsCacheTags.slice('bottleStatus', filters.bottleStatus));
  cacheTag(...tags);

  try {
    const {
      spiritType,
      status,
      bottleStatus,
      brand,
      country,
      region,
      limitedEdition,
      search,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build query
    const conditions = [];
    if (spiritType) conditions.push(eq(spirits.spiritType, spiritType));
    if (status) conditions.push(eq(spirits.status, status));
    if (bottleStatus) conditions.push(eq(spirits.bottleStatus, bottleStatus));
    if (brand) conditions.push(like(sql`LOWER(${spirits.brand})`, `%${brand.toLowerCase()}%`));
    if (country)
      conditions.push(like(sql`LOWER(${spirits.country})`, `%${country.toLowerCase()}%`));
    if (region) conditions.push(like(sql`LOWER(${spirits.region})`, `%${region.toLowerCase()}%`));
    if (limitedEdition !== undefined) conditions.push(eq(spirits.limitedEdition, limitedEdition));

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${spirits.name})`, searchLower),
          like(sql`LOWER(${spirits.brand})`, searchLower),
          like(sql`LOWER(${spirits.distillery})`, searchLower),
          like(sql`LOWER(${spirits.notes})`, searchLower)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort mapping
    const sortColumn =
      {
        itemNumber: spirits.itemNumber,
        name: spirits.name,
        spiritType: spirits.spiritType,
        vintage: spirits.vintage,
        age: spirits.age,
        createdAt: spirits.createdAt,
        updatedAt: spirits.updatedAt,
      }[sortBy] || spirits.createdAt;

    const result = await db
      .select()
      .from(spirits)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? sortColumn : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row,
      abv: row.abv ? Number(row.abv) : null,
      purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
      currentValue: row.currentValue ? Number(row.currentValue) : null,
      estimatedValue: row.estimatedValue ? Number(row.estimatedValue) : null,
      bottlingDate: row.bottlingDate ?? null,
      acquiredDate: row.acquiredDate ?? null,
      attachmentImages: row.attachmentImages ?? null,
    })) as Spirit[];
  } catch (error) {
    logSpiritDataError('Error fetching spirits', error, { filters });
    throw error;
  }
}

/**
 * Get total count of spirits
 *
 * Cache: 2 minutes
 * Tags: 'spirits', 'spirits:list'
 */
export async function countSpirits(filters: SpiritFilters = {}): Promise<number> {
  'use cache';
  cacheLife('seconds');
  cacheTag(spiritsCacheTags.root, spiritsCacheTags.list);

  try {
    const { spiritType, status, bottleStatus, brand, country, region, limitedEdition, search } =
      filters;

    const conditions = [];
    if (spiritType) conditions.push(eq(spirits.spiritType, spiritType));
    if (status) conditions.push(eq(spirits.status, status));
    if (bottleStatus) conditions.push(eq(spirits.bottleStatus, bottleStatus));
    if (brand) conditions.push(like(sql`LOWER(${spirits.brand})`, `%${brand.toLowerCase()}%`));
    if (country)
      conditions.push(like(sql`LOWER(${spirits.country})`, `%${country.toLowerCase()}%`));
    if (region) conditions.push(like(sql`LOWER(${spirits.region})`, `%${region.toLowerCase()}%`));
    if (limitedEdition !== undefined) conditions.push(eq(spirits.limitedEdition, limitedEdition));

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${spirits.name})`, searchLower),
          like(sql`LOWER(${spirits.brand})`, searchLower),
          like(sql`LOWER(${spirits.distillery})`, searchLower),
          like(sql`LOWER(${spirits.notes})`, searchLower)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(spirits)
      .where(whereClause);

    return Number(result[0]?.count ?? 0);
  } catch (error) {
    logSpiritDataError('Error counting spirits', error, { filters });
    throw error;
  }
}

// ============================================================================
// WRITE OPERATIONS (with cache invalidation)
// ============================================================================

/**
 * Create a new spirit
 *
 * Invalidates: 'spirits', 'spirits:list', status/type slices
 */
export async function createSpirit(data: CreateSpiritInput): Promise<Spirit> {
  try {
    const insertData = {
      name: data.name,
      spiritType: data.spiritType,
      brand: data.brand ?? null,
      distillery: data.distillery ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      vintage: data.vintage ?? null,
      age: data.age ?? null,
      abv: data.abv !== undefined && data.abv !== null ? String(data.abv) : null,
      volumeMl: data.volumeMl ?? null,
      bottleNumber: data.bottleNumber ?? null,
      limitedEdition: data.limitedEdition ?? false,
      caskType: data.caskType ?? null,
      bottlingDate: data.bottlingDate
        ? data.bottlingDate instanceof Date
          ? data.bottlingDate.toISOString().split('T')[0]
          : String(data.bottlingDate)
        : null,
      acquiredDate: data.acquiredDate
        ? data.acquiredDate instanceof Date
          ? data.acquiredDate.toISOString().split('T')[0]
          : String(data.acquiredDate)
        : null,
      purchasePrice:
        data.purchasePrice !== undefined && data.purchasePrice !== null
          ? String(data.purchasePrice)
          : null,
      currentValue:
        data.currentValue !== undefined && data.currentValue !== null
          ? String(data.currentValue)
          : null,
      estimatedValue:
        data.estimatedValue !== undefined && data.estimatedValue !== null
          ? String(data.estimatedValue)
          : null,
      status: data.status ?? 'COLLECTION',
      bottleStatus: data.bottleStatus ?? 'SEALED',
      storageCondition: data.storageCondition ?? null,
      location: data.location ?? null,
      tastingNotes: data.tastingNotes ?? null,
      notes: data.notes ?? null,
      mainImage: data.mainImage ?? null,
      attachmentImages: data.attachmentImages ?? null,
    };

    const result = await db.insert(spirits).values(insertData).returning();

    if (!result[0]) {
      throw new Error('Failed to create spirit');
    }

    // Invalidate cache
    revalidateTag(spiritsCacheTags.root, 'max');
    revalidateTag(spiritsCacheTags.list, 'max');
    revalidateTag(spiritsCacheTags.slice('status', insertData.status), 'max');
    revalidateTag(spiritsCacheTags.slice('spiritType', insertData.spiritType), 'max');
    revalidateTag(spiritsCacheTags.slice('bottleStatus', insertData.bottleStatus), 'max');

    const row = result[0];
    return {
      ...row,
      abv: row.abv ? Number(row.abv) : null,
      purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
      currentValue: row.currentValue ? Number(row.currentValue) : null,
      estimatedValue: row.estimatedValue ? Number(row.estimatedValue) : null,
      bottlingDate: row.bottlingDate ?? null,
      acquiredDate: row.acquiredDate ?? null,
      attachmentImages: row.attachmentImages ?? null,
    } as Spirit;
  } catch (error) {
    logSpiritDataError('Error creating spirit', error, { data });
    throw error;
  }
}

/**
 * Update an existing spirit
 *
 * Invalidates: 'spirits', 'spirits:list', 'spirits:item:{id}', old/new status/type slices
 */
export async function updateSpirit(id: string, data: UpdateSpiritInput): Promise<Spirit> {
  try {
    // Fetch existing spirit for old status/type
    const existing = await getSpiritById(id);
    if (!existing) {
      throw new Error('Spirit not found');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only include defined fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.spiritType !== undefined) updateData.spiritType = data.spiritType;
    if (data.brand !== undefined) updateData.brand = data.brand ?? null;
    if (data.distillery !== undefined) updateData.distillery = data.distillery ?? null;
    if (data.region !== undefined) updateData.region = data.region ?? null;
    if (data.country !== undefined) updateData.country = data.country ?? null;
    if (data.vintage !== undefined) updateData.vintage = data.vintage ?? null;
    if (data.age !== undefined) updateData.age = data.age ?? null;
    if (data.abv !== undefined) updateData.abv = data.abv !== null ? String(data.abv) : null;
    if (data.volumeMl !== undefined) updateData.volumeMl = data.volumeMl ?? null;
    if (data.bottleNumber !== undefined) updateData.bottleNumber = data.bottleNumber ?? null;
    if (data.limitedEdition !== undefined) updateData.limitedEdition = data.limitedEdition;
    if (data.caskType !== undefined) updateData.caskType = data.caskType ?? null;
    if (data.bottlingDate !== undefined)
      updateData.bottlingDate = data.bottlingDate
        ? data.bottlingDate instanceof Date
          ? data.bottlingDate.toISOString().split('T')[0]
          : String(data.bottlingDate)
        : null;
    if (data.acquiredDate !== undefined)
      updateData.acquiredDate = data.acquiredDate
        ? data.acquiredDate instanceof Date
          ? data.acquiredDate.toISOString().split('T')[0]
          : String(data.acquiredDate)
        : null;
    if (data.purchasePrice !== undefined)
      updateData.purchasePrice = data.purchasePrice !== null ? String(data.purchasePrice) : null;
    if (data.currentValue !== undefined)
      updateData.currentValue = data.currentValue !== null ? String(data.currentValue) : null;
    if (data.estimatedValue !== undefined)
      updateData.estimatedValue = data.estimatedValue !== null ? String(data.estimatedValue) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bottleStatus !== undefined) updateData.bottleStatus = data.bottleStatus;
    if (data.storageCondition !== undefined)
      updateData.storageCondition = data.storageCondition ?? null;
    if (data.location !== undefined) updateData.location = data.location ?? null;
    if (data.tastingNotes !== undefined) updateData.tastingNotes = data.tastingNotes ?? null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.mainImage !== undefined) updateData.mainImage = data.mainImage ?? null;
    if (data.attachmentImages !== undefined)
      updateData.attachmentImages = data.attachmentImages ?? null;

    const result = await db.update(spirits).set(updateData).where(eq(spirits.id, id)).returning();

    if (!result[0]) {
      throw new Error('Failed to update spirit');
    }

    // Invalidate cache
    revalidateTag(spiritsCacheTags.root, 'max');
    revalidateTag(spiritsCacheTags.list, 'max');
    revalidateTag(spiritsCacheTags.item(id), 'max');

    // Invalidate old slices
    revalidateTag(spiritsCacheTags.slice('status', existing.status), 'max');
    revalidateTag(spiritsCacheTags.slice('spiritType', existing.spiritType), 'max');
    revalidateTag(spiritsCacheTags.slice('bottleStatus', existing.bottleStatus), 'max');

    // Invalidate new slices if changed
    const newStatus = (data.status ?? existing.status) as SpiritStatus;
    const newType = (data.spiritType ?? existing.spiritType) as SpiritType;
    const newBottleStatus = (data.bottleStatus ?? existing.bottleStatus) as BottleStatus;

    if (newStatus !== existing.status) {
      revalidateTag(spiritsCacheTags.slice('status', newStatus), 'max');
    }
    if (newType !== existing.spiritType) {
      revalidateTag(spiritsCacheTags.slice('spiritType', newType), 'max');
    }
    if (newBottleStatus !== existing.bottleStatus) {
      revalidateTag(spiritsCacheTags.slice('bottleStatus', newBottleStatus), 'max');
    }

    const row = result[0];
    return {
      ...row,
      abv: row.abv ? Number(row.abv) : null,
      purchasePrice: row.purchasePrice ? Number(row.purchasePrice) : null,
      currentValue: row.currentValue ? Number(row.currentValue) : null,
      estimatedValue: row.estimatedValue ? Number(row.estimatedValue) : null,
      bottlingDate: row.bottlingDate ?? null,
      acquiredDate: row.acquiredDate ?? null,
      attachmentImages: row.attachmentImages ?? null,
    } as Spirit;
  } catch (error) {
    logSpiritDataError('Error updating spirit', error, { id, data });
    throw error;
  }
}

/**
 * Delete a spirit
 *
 * Invalidates: 'spirits', 'spirits:list', 'spirits:item:{id}', status/type slices
 */
export async function deleteSpirit(id: string): Promise<void> {
  try {
    // Fetch existing spirit for cache invalidation
    const existing = await getSpiritById(id);
    if (!existing) {
      throw new Error('Spirit not found');
    }

    await db.delete(spirits).where(eq(spirits.id, id));

    // Invalidate cache
    revalidateTag(spiritsCacheTags.root, 'max');
    revalidateTag(spiritsCacheTags.list, 'max');
    revalidateTag(spiritsCacheTags.item(id), 'max');
    revalidateTag(spiritsCacheTags.slice('status', existing.status), 'max');
    revalidateTag(spiritsCacheTags.slice('spiritType', existing.spiritType), 'max');
    revalidateTag(spiritsCacheTags.slice('bottleStatus', existing.bottleStatus), 'max');
  } catch (error) {
    logSpiritDataError('Error deleting spirit', error, { id });
    throw error;
  }
}
