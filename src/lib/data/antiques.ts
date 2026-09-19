/**
 * Antiques Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices and V3 blueprint.
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
 * - Tags: 'antiques', 'antiques:list', 'antiques:item:{id}', 'antiques:status:{status}', 'antiques:category:{category}'
 *
 * Requirements: V3 API-first blueprint
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { db } from '@/db';
import { antiques } from '@/db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { RecordNotFoundError } from '@/lib/data/errors';
import { searchAnyColumn } from '@/lib/data/search';
import { antiquesCacheTags } from '@/modules/core/cache-tags';
import type { AntiqueItem, AntiqueCategory, AntiqueStatus } from '@/modules/antiques/schema';

// ============================================================================
// Types
// ============================================================================

export type AntiqueSortField =
  'itemNumber' | 'name' | 'category' | 'currentValue' | 'createdAt' | 'updatedAt';

export type SortOrder = 'asc' | 'desc';

export interface AntiqueFilters {
  category?: AntiqueCategory;
  status?: AntiqueStatus;
  era?: string;
  dynasty?: string;
  search?: string;
  minValue?: number;
  maxValue?: number;
  limit?: number;
  offset?: number;
  sortBy?: AntiqueSortField;
  sortOrder?: SortOrder;
}

export interface CreateAntiqueData {
  name: string;
  category: AntiqueCategory;
  brand?: string | null;
  model?: string | null;
  subCategory?: string | null;
  material?: string | null;
  bladeSteel?: string | null;
  handleMaterial?: string | null;
  lockType?: string | null;
  setGroup?: string | null;
  era?: string | null;
  dynasty?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  weightG?: number | null;
  condition?: string | null;
  certificate?: string | null;
  appraisalDate?: Date | null;
  appraisalBy?: string | null;
  purchasePrice?: number | null;
  acquiredFrom?: string | null;
  acquiredDate?: Date | null;
  currentValue?: number | null;
  estimatedValue?: number | null;
  soldPrice?: number | null;
  soldDate?: Date | null;
  status?: AntiqueStatus;
  location?: string | null;
  notes?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
}

export type UpdateAntiqueData = Partial<CreateAntiqueData> & {
  id: string;
};

type AntiqueMutationValues = Partial<typeof antiques.$inferInsert>;

function logAntiqueDataError(message: string, error: unknown, meta?: Record<string, unknown>) {
  if (error instanceof Error) {
    dbLogger.error(message, error, meta);
    return;
  }

  dbLogger.error(message, undefined, {
    ...meta,
    ...(error !== undefined ? { error } : {}),
  });
}

function summarizeImageForLog(image?: string | null) {
  if (image === undefined) {
    return undefined;
  }

  if (image === null) {
    return null;
  }

  return {
    length: image.length,
    isDataUrl: image.startsWith('data:'),
  };
}

function summarizeAntiqueWriteData(data: Partial<CreateAntiqueData>) {
  const summary: Record<string, unknown> = { ...data };

  if ('mainImage' in data) {
    summary.mainImage = summarizeImageForLog(data.mainImage);
  }

  if ('attachmentImages' in data) {
    summary.attachmentImages = Array.isArray(data.attachmentImages)
      ? data.attachmentImages.map(image => summarizeImageForLog(image))
      : data.attachmentImages;
  }

  return summary;
}

function buildAntiqueUpdateValues(data: Partial<CreateAntiqueData>): AntiqueMutationValues {
  const updateValues: AntiqueMutationValues = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateValues.name = data.name;
  if (data.category !== undefined) updateValues.category = data.category;
  if (data.brand !== undefined) updateValues.brand = data.brand;
  if (data.model !== undefined) updateValues.model = data.model;
  if (data.subCategory !== undefined) updateValues.subCategory = data.subCategory;
  if (data.material !== undefined) updateValues.material = data.material;
  if (data.bladeSteel !== undefined) updateValues.bladeSteel = data.bladeSteel;
  if (data.handleMaterial !== undefined) updateValues.handleMaterial = data.handleMaterial;
  if (data.lockType !== undefined) updateValues.lockType = data.lockType;
  if (data.setGroup !== undefined) updateValues.setGroup = data.setGroup;
  if (data.era !== undefined) updateValues.era = data.era;
  if (data.dynasty !== undefined) updateValues.dynasty = data.dynasty;
  if (data.lengthCm !== undefined)
    updateValues.lengthCm = data.lengthCm !== null ? data.lengthCm.toString() : null;
  if (data.widthCm !== undefined)
    updateValues.widthCm = data.widthCm !== null ? data.widthCm.toString() : null;
  if (data.heightCm !== undefined)
    updateValues.heightCm = data.heightCm !== null ? data.heightCm.toString() : null;
  if (data.weightG !== undefined)
    updateValues.weightG = data.weightG !== null ? data.weightG.toString() : null;
  if (data.condition !== undefined) updateValues.condition = data.condition;
  if (data.certificate !== undefined) updateValues.certificate = data.certificate;
  if (data.appraisalDate !== undefined)
    updateValues.appraisalDate =
      data.appraisalDate !== null ? data.appraisalDate.toISOString().split('T')[0] : null;
  if (data.appraisalBy !== undefined) updateValues.appraisalBy = data.appraisalBy;
  if (data.purchasePrice !== undefined)
    updateValues.purchasePrice = data.purchasePrice !== null ? data.purchasePrice.toString() : null;
  if (data.acquiredFrom !== undefined) updateValues.acquiredFrom = data.acquiredFrom;
  if (data.acquiredDate !== undefined)
    updateValues.acquiredDate =
      data.acquiredDate !== null ? data.acquiredDate.toISOString().split('T')[0] : null;
  if (data.currentValue !== undefined)
    updateValues.currentValue = data.currentValue !== null ? data.currentValue.toString() : null;
  if (data.estimatedValue !== undefined)
    updateValues.estimatedValue =
      data.estimatedValue !== null ? data.estimatedValue.toString() : null;
  if (data.soldPrice !== undefined)
    updateValues.soldPrice = data.soldPrice !== null ? data.soldPrice.toString() : null;
  if (data.soldDate !== undefined)
    updateValues.soldDate =
      data.soldDate !== null ? data.soldDate.toISOString().split('T')[0] : null;
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.location !== undefined) updateValues.location = data.location;
  if (data.notes !== undefined) updateValues.notes = data.notes;
  if (data.mainImage !== undefined) updateValues.mainImage = data.mainImage;
  if (data.attachmentImages !== undefined) updateValues.attachmentImages = data.attachmentImages;

  return updateValues;
}

function rowToAntiqueItem(row: typeof antiques.$inferSelect): AntiqueItem {
  return {
    id: row.id,
    itemNumber: row.itemNumber,
    name: row.name,
    category: row.category as AntiqueCategory,
    brand: row.brand,
    model: row.model,
    subCategory: row.subCategory,
    material: row.material,
    bladeSteel: row.bladeSteel,
    handleMaterial: row.handleMaterial,
    lockType: row.lockType,
    setGroup: row.setGroup,
    era: row.era,
    dynasty: row.dynasty,
    lengthCm: row.lengthCm,
    widthCm: row.widthCm,
    heightCm: row.heightCm,
    weightG: row.weightG,
    condition: row.condition,
    certificate: row.certificate,
    appraisalDate: row.appraisalDate,
    appraisalBy: row.appraisalBy,
    purchasePrice: row.purchasePrice,
    acquiredFrom: row.acquiredFrom,
    acquiredDate: row.acquiredDate,
    currentValue: row.currentValue,
    estimatedValue: row.estimatedValue,
    soldPrice: row.soldPrice,
    soldDate: row.soldDate,
    status: row.status as AntiqueStatus,
    location: row.location,
    notes: row.notes,
    mainImage: row.mainImage,
    attachmentImages: (row.attachmentImages as string[]) || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ============================================================================
// Read Operations (Cached)
// ============================================================================

/**
 * Get all antiques with optional filtering, sorting, and pagination
 */
export async function getAntiques(filters?: AntiqueFilters): Promise<AntiqueItem[]> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(antiquesCacheTags.root, antiquesCacheTags.list);

  if (filters?.status) {
    cacheTag(antiquesCacheTags.slice('status', filters.status));
  }
  if (filters?.category) {
    cacheTag(antiquesCacheTags.slice('category', filters.category));
  }

  try {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(antiques.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(antiques.status, filters.status));
    }
    if (filters?.era) {
      conditions.push(eq(antiques.era, filters.era));
    }
    if (filters?.dynasty) {
      conditions.push(eq(antiques.dynasty, filters.dynasty));
    }
    const searchCondition = searchAnyColumn(
      [antiques.name, antiques.material, antiques.notes],
      filters?.search
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
    if (filters?.minValue !== undefined) {
      conditions.push(gte(antiques.currentValue, filters.minValue.toString()));
    }
    if (filters?.maxValue !== undefined) {
      conditions.push(lte(antiques.currentValue, filters.maxValue.toString()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortBy = filters?.sortBy || 'itemNumber';
    const sortOrder = filters?.sortOrder || 'desc';
    const sortColumn = antiques[sortBy];
    const orderClause = sortOrder === 'desc' ? desc(sortColumn) : sortColumn;

    let query = db.select().from(antiques).where(whereClause).orderBy(orderClause);

    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as typeof query;
    }

    const rows = await query;
    return rows.map(rowToAntiqueItem);
  } catch (error) {
    logAntiqueDataError('Failed to get antiques', error, { filters });
    throw error;
  }
}

/**
 * Get a single antique by ID
 */
export async function getAntiqueById(id: string): Promise<AntiqueItem | null> {
  'use cache';
  cacheLife('moduleItem');
  cacheTag(antiquesCacheTags.root, antiquesCacheTags.item(id));

  try {
    const rows = await db.select().from(antiques).where(eq(antiques.id, id)).limit(1);

    if (rows.length === 0) {
      return null;
    }

    return rowToAntiqueItem(rows[0]);
  } catch (error) {
    logAntiqueDataError('Failed to get antique by ID', error, { id });
    throw error;
  }
}

/**
 * Count total antiques with optional filters
 */
export async function countAntiques(
  filters?: Omit<AntiqueFilters, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
): Promise<number> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(antiquesCacheTags.root, antiquesCacheTags.list);

  if (filters?.status) {
    cacheTag(antiquesCacheTags.slice('status', filters.status));
  }
  if (filters?.category) {
    cacheTag(antiquesCacheTags.slice('category', filters.category));
  }

  try {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(antiques.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(antiques.status, filters.status));
    }
    if (filters?.era) {
      conditions.push(eq(antiques.era, filters.era));
    }
    if (filters?.dynasty) {
      conditions.push(eq(antiques.dynasty, filters.dynasty));
    }
    const searchCondition = searchAnyColumn(
      [antiques.name, antiques.material, antiques.notes],
      filters?.search
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
    if (filters?.minValue !== undefined) {
      conditions.push(gte(antiques.currentValue, filters.minValue.toString()));
    }
    if (filters?.maxValue !== undefined) {
      conditions.push(lte(antiques.currentValue, filters.maxValue.toString()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(antiques)
      .where(whereClause);

    return result[0]?.count || 0;
  } catch (error) {
    logAntiqueDataError('Failed to count antiques', error, { filters });
    throw error;
  }
}

// ============================================================================
// Write Operations (Invalidate Cache)
// ============================================================================

/**
 * Create a new antique
 */
export async function createAntique(data: CreateAntiqueData): Promise<AntiqueItem> {
  try {
    dbLogger.info('Creating new antique', summarizeAntiqueWriteData(data));

    const insertValues: typeof antiques.$inferInsert = {
      name: data.name,
      category: data.category,
      brand: data.brand ?? null,
      model: data.model ?? null,
      subCategory: data.subCategory ?? null,
      material: data.material ?? null,
      bladeSteel: data.bladeSteel ?? null,
      handleMaterial: data.handleMaterial ?? null,
      lockType: data.lockType ?? null,
      setGroup: data.setGroup ?? null,
      era: data.era ?? null,
      dynasty: data.dynasty ?? null,
      lengthCm:
        data.lengthCm !== undefined && data.lengthCm !== null ? data.lengthCm.toString() : null,
      widthCm: data.widthCm !== undefined && data.widthCm !== null ? data.widthCm.toString() : null,
      heightCm:
        data.heightCm !== undefined && data.heightCm !== null ? data.heightCm.toString() : null,
      weightG: data.weightG !== undefined && data.weightG !== null ? data.weightG.toString() : null,
      condition: data.condition ?? null,
      certificate: data.certificate ?? null,
      appraisalDate: data.appraisalDate ? data.appraisalDate.toISOString().split('T')[0] : null,
      appraisalBy: data.appraisalBy ?? null,
      purchasePrice:
        data.purchasePrice !== undefined && data.purchasePrice !== null
          ? data.purchasePrice.toString()
          : null,
      acquiredFrom: data.acquiredFrom ?? null,
      acquiredDate: data.acquiredDate ? data.acquiredDate.toISOString().split('T')[0] : null,
      currentValue:
        data.currentValue !== undefined && data.currentValue !== null
          ? data.currentValue.toString()
          : null,
      estimatedValue:
        data.estimatedValue !== undefined && data.estimatedValue !== null
          ? data.estimatedValue.toString()
          : null,
      soldPrice:
        data.soldPrice !== undefined && data.soldPrice !== null ? data.soldPrice.toString() : null,
      soldDate: data.soldDate ? data.soldDate.toISOString().split('T')[0] : null,
      status: data.status ?? 'COLLECTION',
      location: data.location ?? null,
      notes: data.notes ?? null,
      mainImage: data.mainImage ?? null,
      attachmentImages: data.attachmentImages ?? [],
    };

    const rows = await db.insert(antiques).values(insertValues).returning();
    const newAntique = rowToAntiqueItem(rows[0]);

    // Invalidate cache
    revalidateTag(antiquesCacheTags.root, 'max');
    revalidateTag(antiquesCacheTags.list, 'max');
    revalidateTag(antiquesCacheTags.slice('status', newAntique.status), 'max');
    revalidateTag(antiquesCacheTags.slice('category', newAntique.category), 'max');

    dbLogger.info('Antique created successfully', {
      id: newAntique.id,
      itemNumber: newAntique.itemNumber,
    });
    return newAntique;
  } catch (error) {
    logAntiqueDataError('Failed to create antique', error, {
      data: summarizeAntiqueWriteData(data),
    });
    throw error;
  }
}

/**
 * Invalidate every cache tag affected by an antique write.
 *
 * Contract: call only AFTER the surrounding transaction has committed —
 * `revalidateTag` does not participate in rollback.
 */
function invalidateAntiqueWriteTags(input: {
  id: string;
  statuses: Array<AntiqueItem['status'] | null | undefined>;
  categories: Array<AntiqueItem['category'] | null | undefined>;
}) {
  revalidateTag(antiquesCacheTags.root, 'max');
  revalidateTag(antiquesCacheTags.list, 'max');
  revalidateTag(antiquesCacheTags.item(input.id), 'max');

  for (const status of input.statuses) {
    if (status) {
      revalidateTag(antiquesCacheTags.slice('status', status), 'max');
    }
  }

  for (const category of input.categories) {
    if (category) {
      revalidateTag(antiquesCacheTags.slice('category', category), 'max');
    }
  }
}

/**
 * Update an existing antique.
 *
 * The read-modify-write runs inside a transaction holding a `SELECT ... FOR
 * UPDATE` row lock: the pre-read status and category decide which cache slices
 * are invalidated, so without the lock two concurrent writes could both observe
 * the old values and leave a slice stale.
 *
 * @throws {RecordNotFoundError} when the antique does not exist.
 */
export async function updateAntique(data: UpdateAntiqueData): Promise<AntiqueItem> {
  const { id, ...updateData } = data;

  try {
    dbLogger.info('Updating antique', { id, ...summarizeAntiqueWriteData(updateData) });

    const { previous, updated } = await db.transaction(async tx => {
      const [locked] = await tx
        .select()
        .from(antiques)
        .where(eq(antiques.id, id))
        .limit(1)
        .for('update');

      if (!locked) {
        throw new RecordNotFoundError('Antique', id);
      }

      const updateValues = buildAntiqueUpdateValues(updateData);

      const rows = await tx.update(antiques).set(updateValues).where(eq(antiques.id, id)).returning();

      if (!rows[0]) {
        throw new RecordNotFoundError('Antique', id);
      }

      return { previous: rowToAntiqueItem(locked), updated: rowToAntiqueItem(rows[0]) };
    });

    invalidateAntiqueWriteTags({
      id,
      statuses: [previous.status, updated.status],
      categories: [previous.category, updated.category],
    });

    dbLogger.info('Antique updated successfully', { id });

    return updated;
  } catch (error) {
    logAntiqueDataError('Failed to update antique', error, { id });
    throw error;
  }
}

/**
 * Delete an antique.
 *
 * @returns `true` when a row was deleted, `false` when it did not exist. This
 * matches `deleteQuilt`: a missing row is an expected outcome the caller maps to
 * 404, not an exception.
 */
export async function deleteAntique(id: string): Promise<boolean> {
  try {
    dbLogger.info('Deleting antique', { id });

    const deleted = await db.transaction(async tx => {
      const [locked] = await tx
        .select()
        .from(antiques)
        .where(eq(antiques.id, id))
        .limit(1)
        .for('update');

      if (!locked) {
        return null;
      }

      await tx.delete(antiques).where(eq(antiques.id, id));

      return rowToAntiqueItem(locked);
    });

    if (!deleted) {
      dbLogger.warn('Antique not found for delete', { id });
      return false;
    }

    invalidateAntiqueWriteTags({
      id,
      statuses: [deleted.status],
      categories: [deleted.category],
    });

    dbLogger.info('Antique deleted successfully', { id });

    return true;
  } catch (error) {
    logAntiqueDataError('Failed to delete antique', error, { id });
    throw error;
  }
}
