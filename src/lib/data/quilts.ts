/**
 * Quilt Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices.
 * Replaces the class-based QuiltRepository pattern.
 *
 * Architecture:
 * - Standalone async functions (not classes)
 * - 'use cache' directive for persistent caching
 * - React cache() for request-level deduplication
 * - Serializable data only (no class instances, no undefined)
 * - Cache invalidation with updateTag()
 *
 * Cache Strategy:
 * - Individual items: 5 minutes
 * - Lists: 2 minutes (120 seconds)
 * - Tags: 'quilts', 'quilts-{id}', 'quilts-status-{status}', 'quilts-season-{season}'
 *
 * Requirements: 2.1-2.6, 3.1-3.6 from Next.js 16 Best Practices Migration spec
 */

import { cache } from 'react';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  updateTag,
} from 'next/cache';

import { sql, withTransaction } from '@/lib/neon';
import { dbLogger } from '@/lib/logger';
import {
  type Quilt,
  type QuiltRow,
  type UsageRecordRow,
  rowToQuilt,
  quiltToRow,
  rowToUsageRecord,
} from '@/lib/database/types';
import { QuiltStatus, Season, UsageType } from '@/lib/validations/quilt';

// ============================================================================
// Types
// ============================================================================

export type QuiltSortField =
  | 'itemNumber'
  | 'name'
  | 'season'
  | 'weightGrams'
  | 'createdAt'
  | 'updatedAt';

export type SortOrder = 'asc' | 'desc';

export interface QuiltFilters {
  season?: Season;
  status?: QuiltStatus;
  location?: string;
  brand?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: QuiltSortField;
  sortOrder?: SortOrder;
}

export interface CreateQuiltData {
  name?: string;
  season: Season;
  lengthCm: number;
  widthCm: number;
  weightGrams: number;
  fillMaterial: string;
  materialDetails?: string | null;
  color: string;
  brand?: string | null;
  purchaseDate?: Date | null;
  location: string;
  packagingInfo?: string | null;
  currentStatus?: QuiltStatus;
  notes?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a quilt name based on its properties
 */
function generateQuiltName(data: CreateQuiltData): string {
  const brand = data.brand || '未知品牌';
  const color = data.color || '未知颜色';
  const weight = data.weightGrams || 0;

  const seasonMap: Record<Season, string> = {
    WINTER: '冬',
    SPRING_AUTUMN: '春秋',
    SUMMER: '夏',
  };
  const season = seasonMap[data.season] || '通用';

  return `${brand}${color}${weight}克${season}被`;
}

/**
 * Get the next available item number
 */
async function getNextItemNumber(): Promise<number> {
  const result = (await sql`
    SELECT COALESCE(MAX(item_number), 0) + 1 as next_number
    FROM quilts
  `) as [{ next_number: number }];
  return result[0]?.next_number || 1;
}

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get quilt by ID
 *
 * Cache: 5 minutes
 * Tags: 'quilts', 'quilts-{id}'
 */
export async function getQuiltById(id: string): Promise<Quilt | null> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('quilts', `quilts-${id}`);

  try {
    const rows = (await sql`
      SELECT * FROM quilts
      WHERE id = ${id}
    `) as QuiltRow[];

    return rows[0] ? rowToQuilt(rows[0]) : null;
  } catch (error) {
    dbLogger.error('Error fetching quilt by ID', { id, error });
    throw error;
  }
}

/**
 * Get all quilts with filters
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'quilts', 'quilts-list', plus dynamic tags based on filters
 */
export async function getQuilts(filters: QuiltFilters = {}): Promise<Quilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)

  // Build cache tags based on filters
  const tags = ['quilts', 'quilts-list'];
  if (filters.status) tags.push(`quilts-status-${filters.status}`);
  if (filters.season) tags.push(`quilts-season-${filters.season}`);
  cacheTag(...tags);

  try {
    const {
      season,
      status,
      location,
      brand,
      search,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Validate sortBy to prevent SQL injection
    const validSortFields: QuiltSortField[] = [
      'itemNumber',
      'name',
      'season',
      'weightGrams',
      'createdAt',
      'updatedAt',
    ];
    const safeSortBy: QuiltSortField = validSortFields.includes(sortBy as QuiltSortField)
      ? (sortBy as QuiltSortField)
      : 'createdAt';
    const safeSortOrder: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // Prepare filter patterns
    const searchPattern = search ? `%${search.toLowerCase()}%` : null;
    const locationPattern = location ? `%${location.toLowerCase()}%` : null;
    const brandPattern = brand ? `%${brand.toLowerCase()}%` : null;

    // Execute query with sorting
    const rows = await executeSortedQuery(
      {
        season: season || null,
        status: status || null,
        locationPattern,
        brandPattern,
        searchPattern,
      },
      safeSortBy,
      safeSortOrder,
      limit,
      offset
    );

    return rows.map(row => rowToQuilt(row));
  } catch (error) {
    dbLogger.error('Error fetching quilts', { filters, error });
    throw error;
  }
}

/**
 * Get quilts by status
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'quilts', 'quilts-status-{status}'
 */
export async function getQuiltsByStatus(status: QuiltStatus): Promise<Quilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('quilts', `quilts-status-${status}`);

  try {
    const rows = (await sql`
      SELECT * FROM quilts
      WHERE current_status = ${status}
      ORDER BY created_at DESC
    `) as QuiltRow[];

    return rows.map(row => rowToQuilt(row));
  } catch (error) {
    dbLogger.error('Error fetching quilts by status', { status, error });
    throw error;
  }
}

/**
 * Get quilts by season
 *
 * Cache: 5 minutes
 * Tags: 'quilts', 'quilts-season-{season}'
 */
export async function getQuiltsBySeason(season: Season): Promise<Quilt[]> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('quilts', `quilts-season-${season}`);

  try {
    const rows = (await sql`
      SELECT * FROM quilts
      WHERE season = ${season}
      ORDER BY created_at DESC
    `) as QuiltRow[];

    return rows.map(row => rowToQuilt(row));
  } catch (error) {
    dbLogger.error('Error fetching quilts by season', { season, error });
    throw error;
  }
}

/**
 * Count quilts with optional filters
 */
export async function countQuilts(filters: QuiltFilters = {}): Promise<number> {
  try {
    const { season, status, location, brand, search } = filters;

    // Determine which combination of filters we have
    const hasSeasonFilter = !!season;
    const hasStatusFilter = !!status;
    const hasLocationFilter = !!location;
    const hasBrandFilter = !!brand;
    const hasSearchFilter = !!search;

    let result: [{ count: string }];

    // No filters - simple count query
    if (
      !hasSeasonFilter &&
      !hasStatusFilter &&
      !hasLocationFilter &&
      !hasBrandFilter &&
      !hasSearchFilter
    ) {
      result = (await sql`SELECT COUNT(*) as count FROM quilts`) as [{ count: string }];
    }
    // Complex filter - use comprehensive query
    else {
      const searchPattern = search ? `%${search.toLowerCase()}%` : '%';
      const locationPattern = location ? `%${location.toLowerCase()}%` : '%';
      const brandPattern = brand ? `%${brand.toLowerCase()}%` : '%';

      result = (await sql`
        SELECT COUNT(*) as count FROM quilts
        WHERE (${season}::text IS NULL OR season = ${season})
          AND (${status}::text IS NULL OR current_status = ${status})
          AND (${location}::text IS NULL OR LOWER(location) LIKE ${locationPattern})
          AND (${brand}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPattern})
          AND (${search}::text IS NULL OR (
            LOWER(name) LIKE ${searchPattern}
            OR LOWER(color) LIKE ${searchPattern}
            OR LOWER(fill_material) LIKE ${searchPattern}
            OR LOWER(COALESCE(notes, '')) LIKE ${searchPattern}
          ))
      `) as [{ count: string }];
    }

    return parseInt(result[0]?.count || '0', 10);
  } catch (error) {
    dbLogger.error('Error counting quilts', { filters, error });
    throw error;
  }
}

// ============================================================================
// WRITE OPERATIONS (with cache invalidation)
// ============================================================================

/**
 * Create a new quilt
 *
 * Invalidates: 'quilts', 'quilts-list', status and season specific tags
 */
export async function createQuilt(data: CreateQuiltData): Promise<Quilt> {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const itemNumber = await getNextItemNumber();
    const name = data.name || generateQuiltName(data);

    dbLogger.info('Creating quilt', { itemNumber, name });

    const rows = (await sql`
      INSERT INTO quilts (
        id, item_number, name, season, length_cm, width_cm,
        weight_grams, fill_material, material_details, color,
        brand, purchase_date, location, packaging_info,
        current_status, notes, image_url, thumbnail_url,
        main_image, attachment_images,
        created_at, updated_at
      ) VALUES (
        ${id},
        ${itemNumber},
        ${name},
        ${data.season},
        ${data.lengthCm},
        ${data.widthCm},
        ${data.weightGrams},
        ${data.fillMaterial},
        ${data.materialDetails || null},
        ${data.color},
        ${data.brand || null},
        ${data.purchaseDate ? data.purchaseDate.toISOString() : null},
        ${data.location},
        ${data.packagingInfo || null},
        ${data.currentStatus || 'STORAGE'},
        ${data.notes || null},
        ${data.imageUrl || null},
        ${data.thumbnailUrl || null},
        ${data.mainImage || null},
        ${data.attachmentImages || []},
        ${now},
        ${now}
      ) RETURNING *
    `) as QuiltRow[];

    const quilt = rowToQuilt(rows[0]);

    // Invalidate cache tags
    updateTag('quilts');
    updateTag('quilts-list');
    updateTag(`quilts-status-${quilt.currentStatus}`);
    updateTag(`quilts-season-${quilt.season}`);

    dbLogger.info('Quilt created successfully', { id, itemNumber });
    return quilt;
  } catch (error) {
    dbLogger.error('Error creating quilt', { data, error });
    throw error;
  }
}

/**
 * Update a quilt
 *
 * Invalidates: specific quilt, list, and related status/season tags
 */
export async function updateQuilt(
  id: string,
  data: Partial<CreateQuiltData>
): Promise<Quilt | null> {
  try {
    // Get current quilt for cache invalidation
    const current = await getQuiltById(id);
    if (!current) {
      dbLogger.warn('Quilt not found for update', { id });
      return null;
    }

    const now = new Date().toISOString();
    const rowData = quiltToRow({ ...current, ...data, updatedAt: new Date(now) });

    // Log image data for debugging
    if (rowData.main_image || rowData.attachment_images) {
      dbLogger.info('Updating quilt with images', {
        id,
        hasMainImage: !!rowData.main_image,
        mainImageLength: rowData.main_image?.length,
        attachmentImagesCount: rowData.attachment_images?.length || 0,
      });
    }

    const rows = (await sql`
      UPDATE quilts SET
        name = ${rowData.name},
        season = ${rowData.season},
        length_cm = ${rowData.length_cm},
        width_cm = ${rowData.width_cm},
        weight_grams = ${rowData.weight_grams},
        fill_material = ${rowData.fill_material},
        material_details = ${rowData.material_details},
        color = ${rowData.color},
        brand = ${rowData.brand},
        purchase_date = ${rowData.purchase_date},
        location = ${rowData.location},
        packaging_info = ${rowData.packaging_info},
        current_status = ${rowData.current_status},
        notes = ${rowData.notes},
        image_url = ${rowData.image_url},
        thumbnail_url = ${rowData.thumbnail_url},
        main_image = ${rowData.main_image},
        attachment_images = ${rowData.attachment_images},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `) as QuiltRow[];

    if (rows.length === 0) {
      return null;
    }

    const updated = rowToQuilt(rows[0]);

    // Invalidate cache tags
    updateTag('quilts');
    updateTag('quilts-list');
    updateTag(`quilts-${id}`);

    // Invalidate old and new status/season tags if they changed
    if (current.currentStatus !== updated.currentStatus) {
      updateTag(`quilts-status-${current.currentStatus}`);
      updateTag(`quilts-status-${updated.currentStatus}`);
    }
    if (current.season !== updated.season) {
      updateTag(`quilts-season-${current.season}`);
      updateTag(`quilts-season-${updated.season}`);
    }

    dbLogger.info('Quilt updated successfully', { id });
    return updated;
  } catch (error) {
    dbLogger.error('Error updating quilt', { id, data, error });
    throw error;
  }
}

/**
 * Update quilt status only (without usage record management)
 *
 * @deprecated Use updateQuiltStatusWithUsageRecord for atomic status changes with usage tracking
 */
export async function updateQuiltStatus(id: string, status: QuiltStatus): Promise<Quilt | null> {
  try {
    // Get current status for cache invalidation
    const current = await getQuiltById(id);
    const oldStatus = current?.currentStatus;

    const now = new Date().toISOString();

    const rows = (await sql`
      UPDATE quilts SET
        current_status = ${status},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `) as QuiltRow[];

    if (rows.length === 0) {
      return null;
    }

    const updated = rowToQuilt(rows[0]);

    // Invalidate cache tags
    updateTag('quilts');
    updateTag('quilts-list');
    updateTag(`quilts-${id}`);
    if (oldStatus) {
      updateTag(`quilts-status-${oldStatus}`);
    }
    updateTag(`quilts-status-${status}`);

    dbLogger.info('Quilt status updated', { id, status });
    return updated;
  } catch (error) {
    dbLogger.error('Error updating quilt status', { id, status, error });
    throw error;
  }
}

/**
 * Update quilt status with atomic usage record management
 *
 * Ensures that status changes and usage record operations are executed atomically.
 *
 * Behavior:
 * - When changing TO IN_USE: Creates a new usage record with start_date
 * - When changing FROM IN_USE: Ends the active usage record with end_date
 * - Validates that only one active usage record exists for IN_USE quilts
 */
export async function updateQuiltStatusWithUsageRecord(
  id: string,
  newStatus: QuiltStatus,
  usageType: UsageType = 'REGULAR',
  notes?: string
): Promise<{
  quilt: Quilt;
  usageRecord?: { id: string; quiltId: string; startDate: Date; endDate: Date | null };
}> {
  try {
    return await withTransaction(async () => {
      const now = new Date();
      const nowIso = now.toISOString();

      // Get current quilt to check existing status
      const currentRows = (await sql`
        SELECT * FROM quilts WHERE id = ${id}
      `) as QuiltRow[];

      if (currentRows.length === 0) {
        throw new Error('Quilt not found');
      }

      const currentQuilt = rowToQuilt(currentRows[0]);
      const previousStatus = currentQuilt.currentStatus;

      // If status is not changing, just return the current quilt
      if (previousStatus === newStatus) {
        dbLogger.info('Status unchanged, no action needed', { id, status: newStatus });
        return { quilt: currentQuilt };
      }

      let usageRecord:
        | { id: string; quiltId: string; startDate: Date; endDate: Date | null }
        | undefined;

      // Handle transition FROM IN_USE to another status
      if (previousStatus === 'IN_USE' && newStatus !== 'IN_USE') {
        const endedRows = (await sql`
          UPDATE usage_records
          SET
            end_date = ${nowIso},
            updated_at = ${nowIso}
          WHERE quilt_id = ${id}
            AND end_date IS NULL
          RETURNING *
        `) as UsageRecordRow[];

        if (endedRows.length > 0) {
          const record = rowToUsageRecord(endedRows[0]);
          usageRecord = {
            id: record.id,
            quiltId: record.quiltId,
            startDate: record.startDate,
            endDate: record.endDate,
          };
          dbLogger.info('Usage record ended', { id: record.id, quiltId: id });
        }
      }

      // Handle transition TO IN_USE from another status
      if (newStatus === 'IN_USE' && previousStatus !== 'IN_USE') {
        // Verify no active usage record exists
        const activeCheck = (await sql`
          SELECT COUNT(*) as count FROM usage_records
          WHERE quilt_id = ${id} AND end_date IS NULL
        `) as [{ count: string }];

        const activeCount = parseInt(activeCheck[0]?.count || '0', 10);
        if (activeCount > 0) {
          throw new Error('Quilt already has an active usage record');
        }

        // Create new usage record
        const usageId = crypto.randomUUID();
        const createdRows = (await sql`
          INSERT INTO usage_records (
            id, quilt_id, start_date, end_date, usage_type, notes, created_at, updated_at
          ) VALUES (
            ${usageId},
            ${id},
            ${nowIso},
            ${null},
            ${usageType},
            ${notes || null},
            ${nowIso},
            ${nowIso}
          ) RETURNING *
        `) as UsageRecordRow[];

        if (createdRows.length > 0) {
          const record = rowToUsageRecord(createdRows[0]);
          usageRecord = {
            id: record.id,
            quiltId: record.quiltId,
            startDate: record.startDate,
            endDate: record.endDate,
          };
          dbLogger.info('Usage record created', { id: record.id, quiltId: id });
        }
      }

      // Update the quilt status
      const updatedRows = (await sql`
        UPDATE quilts SET
          current_status = ${newStatus},
          updated_at = ${nowIso}
        WHERE id = ${id}
        RETURNING *
      `) as QuiltRow[];

      if (updatedRows.length === 0) {
        throw new Error('Failed to update quilt status');
      }

      const updatedQuilt = rowToQuilt(updatedRows[0]);

      // Invalidate cache tags
      updateTag('quilts');
      updateTag('quilts-list');
      updateTag(`quilts-${id}`);
      updateTag(`quilts-status-${previousStatus}`);
      updateTag(`quilts-status-${newStatus}`);

      dbLogger.info('Quilt status updated atomically', {
        id,
        previousStatus,
        newStatus,
        hasUsageRecord: !!usageRecord,
      });

      return { quilt: updatedQuilt, usageRecord };
    });
  } catch (error) {
    dbLogger.error('Error updating quilt status with usage record', { id, newStatus, error });
    throw error;
  }
}

/**
 * Delete a quilt and its related records
 *
 * Invalidates: all quilt-related caches
 */
export async function deleteQuilt(id: string): Promise<boolean> {
  try {
    // Get quilt info for cache invalidation before deletion
    const quilt = await getQuiltById(id);

    // Delete related records first
    await sql`DELETE FROM usage_records WHERE quilt_id = ${id}`;
    await sql`DELETE FROM maintenance_records WHERE quilt_id = ${id}`;

    // Delete the quilt
    const result = await sql`
      DELETE FROM quilts WHERE id = ${id}
      RETURNING id
    `;

    const success = result.length > 0;
    if (success) {
      // Invalidate cache tags
      updateTag('quilts');
      updateTag('quilts-list');
      updateTag(`quilts-${id}`);
      if (quilt) {
        updateTag(`quilts-status-${quilt.currentStatus}`);
        updateTag(`quilts-season-${quilt.season}`);
      }

      dbLogger.info('Quilt deleted successfully', { id });
    }
    return success;
  } catch (error) {
    dbLogger.error('Error deleting quilt', { id, error });
    throw error;
  }
}

/**
 * Get the count of active usage records for a quilt
 */
export async function getActiveUsageRecordCount(quiltId: string): Promise<number> {
  try {
    const result = (await sql`
      SELECT COUNT(*) as count FROM usage_records
      WHERE quilt_id = ${quiltId} AND end_date IS NULL
    `) as [{ count: string }];

    return parseInt(result[0]?.count || '0', 10);
  } catch (error) {
    dbLogger.error('Error getting active usage record count', { quiltId, error });
    throw error;
  }
}

// ============================================================================
// Helper: Sorted Query Execution
// ============================================================================

/**
 * Execute a sorted query based on the sortBy field
 *
 * Uses separate queries for each sort field to maintain SQL injection safety
 * while supporting database-level sorting.
 */
async function executeSortedQuery(
  params: {
    season: Season | null;
    status: QuiltStatus | null;
    locationPattern: string | null;
    brandPattern: string | null;
    searchPattern: string | null;
  },
  sortBy: QuiltSortField,
  sortOrder: SortOrder,
  limit: number,
  offset: number
): Promise<QuiltRow[]> {
  const { season, status, locationPattern, brandPattern, searchPattern } = params;
  const isAsc = sortOrder === 'asc';

  // Check if we have any filters
  const hasFilters = season || status || locationPattern || brandPattern || searchPattern;

  if (!hasFilters) {
    // No filters - just sort
    switch (sortBy) {
      case 'itemNumber':
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY item_number ASC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY item_number DESC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
      case 'name':
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY name DESC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
      case 'season':
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY season ASC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY season DESC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
      case 'weightGrams':
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY weight_grams ASC NULLS LAST LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY weight_grams DESC NULLS LAST LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
      case 'createdAt':
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
      case 'updatedAt':
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY updated_at ASC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
      default:
        return isAsc
          ? ((await sql`SELECT * FROM quilts ORDER BY created_at ASC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[])
          : ((await sql`SELECT * FROM quilts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`) as QuiltRow[]);
    }
  }

  // With filters - use comprehensive query with dynamic sorting
  const searchPatternVal = searchPattern || '%';
  const locationPatternVal = locationPattern || '%';
  const brandPatternVal = brandPattern || '%';

  switch (sortBy) {
    case 'itemNumber':
      return isAsc
        ? ((await sql`
            SELECT * FROM quilts
            WHERE (${season}::text IS NULL OR season = ${season})
              AND (${status}::text IS NULL OR current_status = ${status})
              AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
              AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
              AND (${searchPattern}::text IS NULL OR (
                LOWER(name) LIKE ${searchPatternVal}
                OR LOWER(color) LIKE ${searchPatternVal}
                OR LOWER(fill_material) LIKE ${searchPatternVal}
                OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
              ))
            ORDER BY item_number ASC
            LIMIT ${limit} OFFSET ${offset}
          `) as QuiltRow[])
        : ((await sql`
            SELECT * FROM quilts
            WHERE (${season}::text IS NULL OR season = ${season})
              AND (${status}::text IS NULL OR current_status = ${status})
              AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
              AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
              AND (${searchPattern}::text IS NULL OR (
                LOWER(name) LIKE ${searchPatternVal}
                OR LOWER(color) LIKE ${searchPatternVal}
                OR LOWER(fill_material) LIKE ${searchPatternVal}
                OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
              ))
            ORDER BY item_number DESC
            LIMIT ${limit} OFFSET ${offset}
          `) as QuiltRow[]);
    case 'name':
      return isAsc
        ? ((await sql`
            SELECT * FROM quilts
            WHERE (${season}::text IS NULL OR season = ${season})
              AND (${status}::text IS NULL OR current_status = ${status})
              AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
              AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
              AND (${searchPattern}::text IS NULL OR (
                LOWER(name) LIKE ${searchPatternVal}
                OR LOWER(color) LIKE ${searchPatternVal}
                OR LOWER(fill_material) LIKE ${searchPatternVal}
                OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
              ))
            ORDER BY name ASC
            LIMIT ${limit} OFFSET ${offset}
          `) as QuiltRow[])
        : ((await sql`
            SELECT * FROM quilts
            WHERE (${season}::text IS NULL OR season = ${season})
              AND (${status}::text IS NULL OR current_status = ${status})
              AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
              AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
              AND (${searchPattern}::text IS NULL OR (
                LOWER(name) LIKE ${searchPatternVal}
                OR LOWER(color) LIKE ${searchPatternVal}
                OR LOWER(fill_material) LIKE ${searchPatternVal}
                OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
              ))
            ORDER BY name DESC
            LIMIT ${limit} OFFSET ${offset}
          `) as QuiltRow[]);
    case 'createdAt':
      return isAsc
        ? ((await sql`
            SELECT * FROM quilts
            WHERE (${season}::text IS NULL OR season = ${season})
              AND (${status}::text IS NULL OR current_status = ${status})
              AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
              AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
              AND (${searchPattern}::text IS NULL OR (
                LOWER(name) LIKE ${searchPatternVal}
                OR LOWER(color) LIKE ${searchPatternVal}
                OR LOWER(fill_material) LIKE ${searchPatternVal}
                OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
              ))
            ORDER BY created_at ASC
            LIMIT ${limit} OFFSET ${offset}
          `) as QuiltRow[])
        : ((await sql`
            SELECT * FROM quilts
            WHERE (${season}::text IS NULL OR season = ${season})
              AND (${status}::text IS NULL OR current_status = ${status})
              AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
              AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
              AND (${searchPattern}::text IS NULL OR (
                LOWER(name) LIKE ${searchPatternVal}
                OR LOWER(color) LIKE ${searchPatternVal}
                OR LOWER(fill_material) LIKE ${searchPatternVal}
                OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
              ))
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `) as QuiltRow[]);
    default:
      // Default to createdAt DESC
      return (await sql`
        SELECT * FROM quilts
        WHERE (${season}::text IS NULL OR season = ${season})
          AND (${status}::text IS NULL OR current_status = ${status})
          AND (${locationPattern}::text IS NULL OR LOWER(location) LIKE ${locationPatternVal})
          AND (${brandPattern}::text IS NULL OR LOWER(COALESCE(brand, '')) LIKE ${brandPatternVal})
          AND (${searchPattern}::text IS NULL OR (
            LOWER(name) LIKE ${searchPatternVal}
            OR LOWER(color) LIKE ${searchPatternVal}
            OR LOWER(fill_material) LIKE ${searchPatternVal}
            OR LOWER(COALESCE(notes, '')) LIKE ${searchPatternVal}
          ))
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as QuiltRow[];
  }
}

// ============================================================================
// REQUEST DEDUPLICATION (React cache wrappers)
// ============================================================================

/**
 * React cache() wrappers for request-level deduplication
 *
 * Use these in components/pages for additional request-level caching
 * within a single render. These wrap the 'use cache' functions above.
 */
export const getQuiltByIdCached = cache(getQuiltById);
export const getQuiltsCached = cache(getQuilts);
export const getQuiltsByStatusCached = cache(getQuiltsByStatus);
export const getQuiltsBySeasonCached = cache(getQuiltsBySeason);
export const countQuiltsCached = cache(countQuilts);
