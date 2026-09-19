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
 * - Individual items: `moduleItem` profile (revalidate 5 minutes)
 * - Lists: `moduleList` profile (revalidate 2 minutes)
 * - Tags: 'spirits', 'spirits:item:{id}', 'spirits:status:{status}', 'spirits:type:{type}'
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { spirits } from '@/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { RecordNotFoundError } from '@/lib/data/errors';
import { containsInsensitiveFilter, searchAnyColumn } from '@/lib/data/search';
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

/**
 * Convert a raw database row to a Spirit domain object.
 *
 * Numeric columns come back as strings and `date` columns as 'YYYY-MM-DD'
 * strings, so both are normalized here instead of relying on casts.
 */
function rowToSpirit(row: typeof spirits.$inferSelect): Spirit {
  return {
    id: row.id,
    itemNumber: row.itemNumber,
    name: row.name,
    spiritType: row.spiritType,
    subType: row.subType ?? null,
    brand: row.brand ?? null,
    model: row.model ?? null,
    distillery: row.distillery ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    vintage: row.vintage ?? null,
    age: row.age ?? null,
    abv: row.abv !== null && row.abv !== undefined ? Number(row.abv) : null,
    volumeMl: row.volumeMl ?? null,
    bottleNumber: row.bottleNumber ?? null,
    limitedEdition: row.limitedEdition,
    caskType: row.caskType ?? null,
    bottlingDate: row.bottlingDate ? new Date(row.bottlingDate) : null,
    acquiredDate: row.acquiredDate ? new Date(row.acquiredDate) : null,
    acquiredFrom: row.acquiredFrom ?? null,
    purchasePrice:
      row.purchasePrice !== null && row.purchasePrice !== undefined
        ? Number(row.purchasePrice)
        : null,
    currentValue:
      row.currentValue !== null && row.currentValue !== undefined ? Number(row.currentValue) : null,
    estimatedValue:
      row.estimatedValue !== null && row.estimatedValue !== undefined
        ? Number(row.estimatedValue)
        : null,
    status: row.status,
    bottleStatus: row.bottleStatus,
    storageCondition: row.storageCondition ?? null,
    location: row.location ?? null,
    tastingNotes: row.tastingNotes ?? null,
    notes: row.notes ?? null,
    mainImage: row.mainImage ?? null,
    attachmentImages: row.attachmentImages ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get spirit by ID
 *
 * Cache: `moduleItem` profile (revalidate 5 minutes)
 * Tags: 'spirits', 'spirits:item:{id}'
 */
export async function getSpiritById(id: string): Promise<Spirit | null> {
  'use cache';
  cacheLife('moduleItem');
  cacheTag(spiritsCacheTags.root, spiritsCacheTags.item(id));

  try {
    const result = await db.select().from(spirits).where(eq(spirits.id, id));

    if (!result[0]) return null;

    return rowToSpirit(result[0]);
  } catch (error) {
    logSpiritDataError('Error fetching spirit by ID', error, { id });
    throw error;
  }
}

/**
 * Get all spirits with filters
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 * Tags: 'spirits', 'spirits:list', plus dynamic tags based on filters
 */
export async function getSpirits(filters: SpiritFilters = {}): Promise<Spirit[]> {
  'use cache';
  cacheLife('moduleList');

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
    const brandCondition = containsInsensitiveFilter(spirits.brand, brand);
    if (brandCondition) conditions.push(brandCondition);

    const countryCondition = containsInsensitiveFilter(spirits.country, country);
    if (countryCondition) conditions.push(countryCondition);

    const regionCondition = containsInsensitiveFilter(spirits.region, region);
    if (regionCondition) conditions.push(regionCondition);

    if (limitedEdition !== undefined) conditions.push(eq(spirits.limitedEdition, limitedEdition));

    const searchCondition = searchAnyColumn(
      [spirits.name, spirits.brand, spirits.distillery, spirits.notes],
      search
    );
    if (searchCondition) conditions.push(searchCondition);

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

    return result.map(row => rowToSpirit(row));
  } catch (error) {
    logSpiritDataError('Error fetching spirits', error, { filters });
    throw error;
  }
}

/**
 * Get total count of spirits
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 * Tags: 'spirits', 'spirits:list'
 */
export async function countSpirits(filters: SpiritFilters = {}): Promise<number> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(spiritsCacheTags.root, spiritsCacheTags.list);

  try {
    const { spiritType, status, bottleStatus, brand, country, region, limitedEdition, search } =
      filters;

    const conditions = [];
    if (spiritType) conditions.push(eq(spirits.spiritType, spiritType));
    if (status) conditions.push(eq(spirits.status, status));
    if (bottleStatus) conditions.push(eq(spirits.bottleStatus, bottleStatus));
    const brandCondition = containsInsensitiveFilter(spirits.brand, brand);
    if (brandCondition) conditions.push(brandCondition);

    const countryCondition = containsInsensitiveFilter(spirits.country, country);
    if (countryCondition) conditions.push(countryCondition);

    const regionCondition = containsInsensitiveFilter(spirits.region, region);
    if (regionCondition) conditions.push(regionCondition);

    if (limitedEdition !== undefined) conditions.push(eq(spirits.limitedEdition, limitedEdition));

    const searchCondition = searchAnyColumn(
      [spirits.name, spirits.brand, spirits.distillery, spirits.notes],
      search
    );
    if (searchCondition) conditions.push(searchCondition);

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
      subType: data.subType ?? null,
      brand: data.brand ?? null,
      model: data.model ?? null,
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
      acquiredFrom: data.acquiredFrom ?? null,
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
    return rowToSpirit(row);
  } catch (error) {
    logSpiritDataError('Error creating spirit', error, { data });
    throw error;
  }
}

/**
 * Invalidate every cache tag affected by a spirit write.
 *
 * Contract: call only AFTER the surrounding transaction has committed —
 * `revalidateTag` does not participate in rollback. Passing both the previous
 * and the updated slice values covers "changed" and "unchanged" uniformly, so
 * there is no branch to get wrong.
 */
function invalidateSpiritWriteTags(input: {
  id: string;
  statuses: Array<SpiritStatus | null | undefined>;
  spiritTypes: Array<SpiritType | null | undefined>;
  bottleStatuses: Array<BottleStatus | null | undefined>;
}) {
  revalidateTag(spiritsCacheTags.root, 'max');
  revalidateTag(spiritsCacheTags.list, 'max');
  revalidateTag(spiritsCacheTags.item(input.id), 'max');

  for (const status of input.statuses) {
    if (status) revalidateTag(spiritsCacheTags.slice('status', status), 'max');
  }

  for (const spiritType of input.spiritTypes) {
    if (spiritType) revalidateTag(spiritsCacheTags.slice('spiritType', spiritType), 'max');
  }

  for (const bottleStatus of input.bottleStatuses) {
    if (bottleStatus) revalidateTag(spiritsCacheTags.slice('bottleStatus', bottleStatus), 'max');
  }
}

/**
 * Update an existing spirit
 *
 * The read-modify-write runs inside a transaction holding a `SELECT ... FOR
 * UPDATE` row lock: the pre-read status/type/bottle-status decide which cache
 * slices are invalidated, so without the lock two concurrent writes could both
 * observe the old values and leave a slice stale.
 *
 * @throws {RecordNotFoundError} when the spirit does not exist.
 */
export async function updateSpirit(id: string, data: UpdateSpiritInput): Promise<Spirit> {
  try {
    const { previous, updated } = await db.transaction(async tx => {
      const existingRows = await tx
        .select()
        .from(spirits)
        .where(eq(spirits.id, id))
        .limit(1)
        .for('update');

      const existingRow = existingRows[0];
      if (!existingRow) {
        throw new RecordNotFoundError('Spirit', id);
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Only include defined fields
      if (data.name !== undefined) updateData.name = data.name;
      if (data.spiritType !== undefined) updateData.spiritType = data.spiritType;
      if (data.subType !== undefined) updateData.subType = data.subType ?? null;
      if (data.brand !== undefined) updateData.brand = data.brand ?? null;
      if (data.model !== undefined) updateData.model = data.model ?? null;
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
      if (data.acquiredFrom !== undefined) updateData.acquiredFrom = data.acquiredFrom ?? null;
      if (data.purchasePrice !== undefined)
        updateData.purchasePrice = data.purchasePrice !== null ? String(data.purchasePrice) : null;
      if (data.currentValue !== undefined)
        updateData.currentValue = data.currentValue !== null ? String(data.currentValue) : null;
      if (data.estimatedValue !== undefined)
        updateData.estimatedValue =
          data.estimatedValue !== null ? String(data.estimatedValue) : null;
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

      const result = await tx
        .update(spirits)
        .set(updateData)
        .where(eq(spirits.id, id))
        .returning();

      if (!result[0]) {
        throw new RecordNotFoundError('Spirit', id);
      }

      return { previous: rowToSpirit(existingRow), updated: rowToSpirit(result[0]) };
    });

    invalidateSpiritWriteTags({
      id,
      statuses: [previous.status, updated.status],
      spiritTypes: [previous.spiritType, updated.spiritType],
      bottleStatuses: [previous.bottleStatus, updated.bottleStatus],
    });

    return updated;
  } catch (error) {
    logSpiritDataError('Error updating spirit', error, { id, data });
    throw error;
  }
}

/**
 * Delete a spirit.
 *
 * @returns `true` when a row was deleted, `false` when it did not exist. This
 * matches `deleteQuilt`: a missing row is an expected outcome the caller maps to
 * 404, not an exception.
 */
export async function deleteSpirit(id: string): Promise<boolean> {
  try {
    const deleted = await db.transaction(async tx => {
      const existingRows = await tx
        .select()
        .from(spirits)
        .where(eq(spirits.id, id))
        .limit(1)
        .for('update');

      const existingRow = existingRows[0];
      if (!existingRow) {
        return null;
      }

      await tx.delete(spirits).where(eq(spirits.id, id));

      return rowToSpirit(existingRow);
    });

    if (!deleted) {
      dbLogger.warn('Spirit not found for delete', { id });
      return false;
    }

    invalidateSpiritWriteTags({
      id,
      statuses: [deleted.status],
      spiritTypes: [deleted.spiritType],
      bottleStatuses: [deleted.bottleStatus],
    });

    return true;
  } catch (error) {
    logSpiritDataError('Error deleting spirit', error, { id });
    throw error;
  }
}
