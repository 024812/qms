/**
 * Maps Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices.
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
 * - Tags: 'maps', 'maps:item:{id}', 'maps:status:{status}', 'maps:mapType:{type}'
 *
 * Requirements: V3 API-first blueprint
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { db } from '@/db';
import { maps } from '@/db/schema';
import { eq, sql, desc, and, like, or, asc } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { mapsCacheTags } from '@/modules/core/cache-tags';
import type { MapStatus, MapType, MapMaterial } from '@/modules/maps/schema';

// ============================================================================
// Types
// ============================================================================

export type MapSortField =
  'itemNumber' | 'name' | 'mapType' | 'publishedYear' | 'createdAt' | 'updatedAt';

export type SortOrder = 'asc' | 'desc';

export interface MapFilters {
  mapType?: MapType;
  status?: MapStatus;
  material?: MapMaterial;
  region?: string;
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: MapSortField;
  sortOrder?: SortOrder;
}

export interface CreateMapData {
  name: string;
  mapType: MapType;
  scale?: string | null;
  publishedYear?: number | null;
  publishedMonth?: number | null;
  printYear?: number | null;
  printMonth?: number | null;
  publisher?: string | null;
  series?: string | null;
  isbn?: string | null;
  originalPrice?: number | null;
  material?: MapMaterial;
  widthCm?: number | null;
  heightCm?: number | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  region?: string | null;
  language?: string | null;
  condition?: string | null;
  isOriginal?: boolean;
  edition?: string | null;
  acquiredDate?: Date | null;
  purchasePrice?: number | null;
  currentValue?: number | null;
  status?: MapStatus;
  location?: string | null;
  notes?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
}

export interface UpdateMapData {
  id: string;
  name?: string;
  mapType?: MapType;
  scale?: string | null;
  publishedYear?: number | null;
  publishedMonth?: number | null;
  printYear?: number | null;
  printMonth?: number | null;
  publisher?: string | null;
  series?: string | null;
  isbn?: string | null;
  originalPrice?: number | null;
  material?: MapMaterial;
  widthCm?: number | null;
  heightCm?: number | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  region?: string | null;
  language?: string | null;
  condition?: string | null;
  isOriginal?: boolean;
  edition?: string | null;
  acquiredDate?: Date | null;
  purchasePrice?: number | null;
  currentValue?: number | null;
  status?: MapStatus;
  location?: string | null;
  notes?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
}

export interface MapRow {
  id: string;
  itemNumber: number;
  name: string;
  mapType: MapType;
  scale: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  printYear: number | null;
  printMonth: number | null;
  publisher: string | null;
  series: string | null;
  isbn: string | null;
  originalPrice: string | null;
  material: MapMaterial;
  widthCm: string | null;
  heightCm: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  region: string | null;
  language: string | null;
  condition: string | null;
  isOriginal: boolean;
  edition: string | null;
  acquiredDate: string | null;
  purchasePrice: string | null;
  currentValue: string | null;
  status: MapStatus;
  location: string | null;
  notes: string | null;
  mainImage: string | null;
  attachmentImages: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapDTO {
  id: string;
  itemNumber: number;
  name: string;
  mapType: MapType;
  scale: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  printYear: number | null;
  printMonth: number | null;
  publisher: string | null;
  series: string | null;
  isbn: string | null;
  originalPrice: number | null;
  material: MapMaterial;
  widthCm: number | null;
  heightCm: number | null;
  country: string | null;
  province: string | null;
  city: string | null;
  region: string | null;
  language: string | null;
  condition: string | null;
  isOriginal: boolean;
  edition: string | null;
  acquiredDate: Date | null;
  purchasePrice: number | null;
  currentValue: number | null;
  status: MapStatus;
  location: string | null;
  notes: string | null;
  mainImage: string | null;
  attachmentImages: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Helpers
// ============================================================================

function logMapDataError(message: string, error: unknown, meta?: Record<string, unknown>) {
  if (error instanceof Error) {
    dbLogger.error(message, error, meta);
    return;
  }

  dbLogger.error(message, undefined, {
    ...meta,
    ...(error !== undefined ? { error } : {}),
  });
}

function parseDecimal(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function rowToDTO(row: MapRow): MapDTO {
  return {
    id: row.id,
    itemNumber: row.itemNumber,
    name: row.name,
    mapType: row.mapType,
    scale: row.scale,
    publishedYear: row.publishedYear,
    publishedMonth: row.publishedMonth,
    printYear: row.printYear,
    printMonth: row.printMonth,
    publisher: row.publisher,
    series: row.series,
    isbn: row.isbn,
    originalPrice: parseDecimal(row.originalPrice),
    material: row.material,
    widthCm: parseDecimal(row.widthCm),
    heightCm: parseDecimal(row.heightCm),
    country: row.country,
    province: row.province,
    city: row.city,
    region: row.region,
    language: row.language,
    condition: row.condition,
    isOriginal: row.isOriginal,
    edition: row.edition,
    acquiredDate: row.acquiredDate ? new Date(row.acquiredDate) : null,
    purchasePrice: parseDecimal(row.purchasePrice),
    currentValue: parseDecimal(row.currentValue),
    status: row.status,
    location: row.location,
    notes: row.notes,
    mainImage: row.mainImage,
    attachmentImages: row.attachmentImages,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildSortClause(sortBy: MapSortField = 'itemNumber', sortOrder: SortOrder = 'asc') {
  const column = {
    itemNumber: maps.itemNumber,
    name: maps.name,
    mapType: maps.mapType,
    publishedYear: maps.publishedYear,
    createdAt: maps.createdAt,
    updatedAt: maps.updatedAt,
  }[sortBy];

  return sortOrder === 'desc' ? desc(column) : asc(column);
}

// ============================================================================
// Cached Read Operations
// ============================================================================

/**
 * Get all maps with optional filtering, sorting, and pagination
 */
export async function getMaps(filters?: MapFilters): Promise<MapDTO[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(mapsCacheTags.root, mapsCacheTags.list);

  if (filters?.status) {
    cacheTag(mapsCacheTags.slice('status', filters.status));
  }
  if (filters?.mapType) {
    cacheTag(mapsCacheTags.slice('mapType', filters.mapType));
  }

  try {
    const conditions = [];

    if (filters?.mapType) {
      conditions.push(eq(maps.mapType, filters.mapType));
    }
    if (filters?.status) {
      conditions.push(eq(maps.status, filters.status));
    }
    if (filters?.material) {
      conditions.push(eq(maps.material, filters.material));
    }
    if (filters?.region) {
      conditions.push(eq(maps.region, filters.region));
    }
    if (filters?.country) {
      conditions.push(eq(maps.country, filters.country));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(maps.name, searchPattern),
          like(maps.publisher, searchPattern),
          like(maps.region, searchPattern),
          like(maps.notes, searchPattern)
        )
      );
    }

    const rows = (await db
      .select()
      .from(maps)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(buildSortClause(filters?.sortBy, filters?.sortOrder))
      .limit(filters?.limit ?? 50)
      .offset(filters?.offset ?? 0)) as MapRow[];
    return rows.map(rowToDTO);
  } catch (error) {
    logMapDataError('Failed to get maps', error, { filters });
    throw new Error('Failed to retrieve maps');
  }
}

/**
 * Get a single map by ID
 */
export async function getMapById(id: string): Promise<MapDTO | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag(mapsCacheTags.root, mapsCacheTags.item(id));

  try {
    const rows = (await db.select().from(maps).where(eq(maps.id, id)).limit(1)) as MapRow[];

    if (rows.length === 0) {
      return null;
    }

    return rowToDTO(rows[0]);
  } catch (error) {
    logMapDataError('Failed to get map by ID', error, { id });
    throw new Error('Failed to retrieve map');
  }
}

/**
 * Count total maps with optional filters
 */
export async function countMaps(
  filters?: Omit<MapFilters, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
): Promise<number> {
  'use cache';
  cacheLife('minutes');
  cacheTag(mapsCacheTags.root, mapsCacheTags.list);

  if (filters?.status) {
    cacheTag(mapsCacheTags.slice('status', filters.status));
  }
  if (filters?.mapType) {
    cacheTag(mapsCacheTags.slice('mapType', filters.mapType));
  }

  try {
    const conditions = [];

    if (filters?.mapType) {
      conditions.push(eq(maps.mapType, filters.mapType));
    }
    if (filters?.status) {
      conditions.push(eq(maps.status, filters.status));
    }
    if (filters?.material) {
      conditions.push(eq(maps.material, filters.material));
    }
    if (filters?.region) {
      conditions.push(eq(maps.region, filters.region));
    }
    if (filters?.country) {
      conditions.push(eq(maps.country, filters.country));
    }
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(maps.name, searchPattern),
          like(maps.publisher, searchPattern),
          like(maps.region, searchPattern),
          like(maps.notes, searchPattern)
        )
      );
    }

    let query = db.select({ count: sql<number>`count(*)` }).from(maps);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query;
    return Number(result[0]?.count ?? 0);
  } catch (error) {
    logMapDataError('Failed to count maps', error, { filters });
    throw new Error('Failed to count maps');
  }
}

// ============================================================================
// Write Operations (with cache invalidation)
// ============================================================================

/**
 * Create a new map
 */
export async function createMap(data: CreateMapData): Promise<MapDTO> {
  try {
    const insertData = {
      name: data.name,
      mapType: data.mapType,
      scale: data.scale ?? null,
      publishedYear: data.publishedYear ?? null,
      publishedMonth: data.publishedMonth ?? null,
      printYear: data.printYear ?? null,
      printMonth: data.printMonth ?? null,
      publisher: data.publisher ?? null,
      series: data.series ?? null,
      isbn: data.isbn ?? null,
      originalPrice: data.originalPrice?.toString() ?? null,
      material: data.material ?? 'PAPER',
      widthCm: data.widthCm?.toString() ?? null,
      heightCm: data.heightCm?.toString() ?? null,
      country: data.country ?? null,
      province: data.province ?? null,
      city: data.city ?? null,
      region: data.region ?? null,
      language: data.language ?? null,
      condition: data.condition ?? null,
      isOriginal: data.isOriginal ?? true,
      edition: data.edition ?? null,
      acquiredDate: data.acquiredDate
        ? data.acquiredDate instanceof Date
          ? data.acquiredDate.toISOString().split('T')[0]
          : String(data.acquiredDate)
        : null,
      purchasePrice: data.purchasePrice?.toString() ?? null,
      currentValue: data.currentValue?.toString() ?? null,
      status: data.status ?? 'COLLECTION',
      location: data.location ?? null,
      notes: data.notes ?? null,
      mainImage: data.mainImage ?? null,
      attachmentImages: data.attachmentImages ?? null,
    };

    const rows = (await db.insert(maps).values(insertData).returning()) as MapRow[];

    if (rows.length === 0) {
      throw new Error('Failed to create map: no rows returned');
    }

    const newMap = rowToDTO(rows[0]);

    // Invalidate cache
    revalidateTag(mapsCacheTags.root, 'max');
    revalidateTag(mapsCacheTags.list, 'max');
    revalidateTag(mapsCacheTags.slice('status', newMap.status), 'max');
    revalidateTag(mapsCacheTags.slice('mapType', newMap.mapType), 'max');

    dbLogger.info('Map created', { id: newMap.id, itemNumber: newMap.itemNumber });

    return newMap;
  } catch (error) {
    logMapDataError('Failed to create map', error, { data });
    throw new Error('Failed to create map');
  }
}

/**
 * Update an existing map
 */
export async function updateMap(data: UpdateMapData): Promise<MapDTO> {
  try {
    // Get current map to know old status/type for cache invalidation
    const currentRows = (await db
      .select()
      .from(maps)
      .where(eq(maps.id, data.id))
      .limit(1)) as MapRow[];

    if (currentRows.length === 0) {
      throw new Error('Map not found');
    }

    const currentMap = rowToDTO(currentRows[0]);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.mapType !== undefined) updateData.mapType = data.mapType;
    if (data.scale !== undefined) updateData.scale = data.scale;
    if (data.publishedYear !== undefined) updateData.publishedYear = data.publishedYear;
    if (data.publishedMonth !== undefined) updateData.publishedMonth = data.publishedMonth;
    if (data.printYear !== undefined) updateData.printYear = data.printYear;
    if (data.printMonth !== undefined) updateData.printMonth = data.printMonth;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.series !== undefined) updateData.series = data.series;
    if (data.isbn !== undefined) updateData.isbn = data.isbn;
    if (data.originalPrice !== undefined)
      updateData.originalPrice = data.originalPrice?.toString() ?? null;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.widthCm !== undefined) updateData.widthCm = data.widthCm?.toString() ?? null;
    if (data.heightCm !== undefined) updateData.heightCm = data.heightCm?.toString() ?? null;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.province !== undefined) updateData.province = data.province;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.isOriginal !== undefined) updateData.isOriginal = data.isOriginal;
    if (data.edition !== undefined) updateData.edition = data.edition;
    if (data.acquiredDate !== undefined)
      updateData.acquiredDate = data.acquiredDate
        ? data.acquiredDate instanceof Date
          ? data.acquiredDate.toISOString().split('T')[0]
          : String(data.acquiredDate)
        : null;
    if (data.purchasePrice !== undefined)
      updateData.purchasePrice = data.purchasePrice?.toString() ?? null;
    if (data.currentValue !== undefined)
      updateData.currentValue = data.currentValue?.toString() ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.mainImage !== undefined) updateData.mainImage = data.mainImage;
    if (data.attachmentImages !== undefined) updateData.attachmentImages = data.attachmentImages;

    const rows = (await db
      .update(maps)
      .set(updateData)
      .where(eq(maps.id, data.id))
      .returning()) as MapRow[];

    if (rows.length === 0) {
      throw new Error('Failed to update map: no rows returned');
    }

    const updatedMap = rowToDTO(rows[0]);

    // Invalidate cache
    revalidateTag(mapsCacheTags.root, 'max');
    revalidateTag(mapsCacheTags.list, 'max');
    revalidateTag(mapsCacheTags.item(data.id), 'max');

    // Invalidate old and new status/type slices if changed
    if (currentMap.status !== updatedMap.status) {
      revalidateTag(mapsCacheTags.slice('status', currentMap.status), 'max');
      revalidateTag(mapsCacheTags.slice('status', updatedMap.status), 'max');
    }
    if (currentMap.mapType !== updatedMap.mapType) {
      revalidateTag(mapsCacheTags.slice('mapType', currentMap.mapType), 'max');
      revalidateTag(mapsCacheTags.slice('mapType', updatedMap.mapType), 'max');
    }

    dbLogger.info('Map updated', { id: updatedMap.id, itemNumber: updatedMap.itemNumber });

    return updatedMap;
  } catch (error) {
    logMapDataError('Failed to update map', error, { id: data.id });
    // Preserve domain errors (e.g. "Map not found") so the actions layer can
    // map them to NOT_FOUND instead of INTERNAL_ERROR.
    if (error instanceof Error && error.message === 'Map not found') {
      throw error;
    }
    throw new Error('Failed to update map');
  }
}

/**
 * Delete a map
 */
export async function deleteMap(id: string): Promise<void> {
  try {
    // Get current map for cache invalidation
    const currentRows = (await db.select().from(maps).where(eq(maps.id, id)).limit(1)) as MapRow[];

    if (currentRows.length === 0) {
      throw new Error('Map not found');
    }

    const currentMap = rowToDTO(currentRows[0]);

    await db.delete(maps).where(eq(maps.id, id));

    // Invalidate cache
    revalidateTag(mapsCacheTags.root, 'max');
    revalidateTag(mapsCacheTags.list, 'max');
    revalidateTag(mapsCacheTags.item(id), 'max');
    revalidateTag(mapsCacheTags.slice('status', currentMap.status), 'max');
    revalidateTag(mapsCacheTags.slice('mapType', currentMap.mapType), 'max');

    dbLogger.info('Map deleted', { id, itemNumber: currentMap.itemNumber });
  } catch (error) {
    logMapDataError('Failed to delete map', error, { id });
    // Preserve domain errors (e.g. "Map not found") so the actions layer can
    // map them to NOT_FOUND instead of INTERNAL_ERROR.
    if (error instanceof Error && error.message === 'Map not found') {
      throw error;
    }
    throw new Error('Failed to delete map');
  }
}
