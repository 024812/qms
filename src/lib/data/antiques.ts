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
 * - Individual items: 5 minutes
 * - Lists: 2 minutes (120 seconds)
 * - Tags: 'antiques', 'antiques:list', 'antiques:item:{id}', 'antiques:status:{status}', 'antiques:category:{category}'
 *
 * Requirements: V3 API-first blueprint
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { db } from '@/db';
import { antiques } from '@/db/schema';
import { eq, sql, desc, and, or, like, gte, lte } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
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
  material?: string | null;
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
  if (data.material !== undefined) updateValues.material = data.material;
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
    material: row.material,
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
  cacheLife('minutes');
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
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(antiques.name, searchPattern),
          like(antiques.material, searchPattern),
          like(antiques.notes, searchPattern)
        )
      );
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
  cacheLife('minutes');
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
  cacheLife('minutes');
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
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(antiques.name, searchPattern),
          like(antiques.material, searchPattern),
          like(antiques.notes, searchPattern)
        )
      );
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
      material: data.material ?? null,
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
 * Update an existing antique
 */
export async function updateAntique(data: UpdateAntiqueData): Promise<AntiqueItem> {
  try {
    const { id, ...updateData } = data;
    dbLogger.info('Updating antique', { id, ...summarizeAntiqueWriteData(updateData) });

    // Get old antique for cache invalidation
    const oldAntique = await getAntiqueById(id);
    if (!oldAntique) {
      throw new Error(`Antique with ID ${id} not found`);
    }

    const updateValues = buildAntiqueUpdateValues(updateData);

    const rows = await db.update(antiques).set(updateValues).where(eq(antiques.id, id)).returning();

    if (rows.length === 0) {
      throw new Error(`Antique with ID ${id} not found`);
    }

    const updatedAntique = rowToAntiqueItem(rows[0]);

    // Invalidate cache
    revalidateTag(antiquesCacheTags.root, 'max');
    revalidateTag(antiquesCacheTags.list, 'max');
    revalidateTag(antiquesCacheTags.item(id), 'max');

    // Invalidate old and new status/category slices
    if (oldAntique.status !== updatedAntique.status) {
      revalidateTag(antiquesCacheTags.slice('status', oldAntique.status), 'max');
      revalidateTag(antiquesCacheTags.slice('status', updatedAntique.status), 'max');
    }
    if (oldAntique.category !== updatedAntique.category) {
      revalidateTag(antiquesCacheTags.slice('category', oldAntique.category), 'max');
      revalidateTag(antiquesCacheTags.slice('category', updatedAntique.category), 'max');
    }

    dbLogger.info('Antique updated successfully', { id });
    return updatedAntique;
  } catch (error) {
    logAntiqueDataError('Failed to update antique', error, { id: data.id });
    throw error;
  }
}

/**
 * Delete an antique
 */
export async function deleteAntique(id: string): Promise<void> {
  try {
    dbLogger.info('Deleting antique', { id });

    // Get antique for cache invalidation
    const antique = await getAntiqueById(id);
    if (!antique) {
      throw new Error(`Antique with ID ${id} not found`);
    }

    await db.delete(antiques).where(eq(antiques.id, id));

    // Invalidate cache
    revalidateTag(antiquesCacheTags.root, 'max');
    revalidateTag(antiquesCacheTags.list, 'max');
    revalidateTag(antiquesCacheTags.item(id), 'max');
    revalidateTag(antiquesCacheTags.slice('status', antique.status), 'max');
    revalidateTag(antiquesCacheTags.slice('category', antique.category), 'max');

    dbLogger.info('Antique deleted successfully', { id });
  } catch (error) {
    logAntiqueDataError('Failed to delete antique', error, { id });
    throw error;
  }
}
