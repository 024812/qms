/**
 * Quilt Repository
 *
 * Handles all database operations for quilts with type safety and proper error handling.
 * 
 * Next.js 16 Caching Strategy:
 * - Read operations (findById, findAll, findByStatus, findBySeason) use "use cache" with appropriate lifetimes
 * - Write operations (create, update, delete) invalidate relevant cache tags using updateTag()
 * - Cache tags: 'quilts', 'quilts-{id}', 'quilts-status-{status}', 'quilts-season-{season}'
 * 
 * Requirements: 9.2 - Next.js 16 caching with cacheLife() and cacheTag()
 */

import { sql, withTransaction } from '@/lib/neon';
import { dbLogger } from '@/lib/logger';
import { BaseRepositoryImpl } from './base.repository';
import {
  Quilt,
  QuiltRow,
  rowToQuilt,
  quiltToRow,
  UsageRecordRow,
  rowToUsageRecord,
} from '@/lib/database/types';
import { QuiltStatus, Season, UsageType } from '@/lib/validations/quilt';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { updateTag } from 'next/cache';

// Valid sort fields that map to database columns
export type QuiltSortField =
  | 'itemNumber'
  | 'name'
  | 'season'
  | 'weightGrams'
  | 'createdAt'
  | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

// Mapping from camelCase field names to snake_case database column names
const _SORT_FIELD_MAP: Record<QuiltSortField, string> = {
  itemNumber: 'item_number',
  name: 'name',
  season: 'season',
  weightGrams: 'weight_grams',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

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

export class QuiltRepository extends BaseRepositoryImpl<QuiltRow, Quilt> {
  protected tableName = 'quilts';

  protected rowToModel(row: QuiltRow): Quilt {
    return rowToQuilt(row);
  }

  protected modelToRow(model: Partial<Quilt>): Partial<QuiltRow> {
    return quiltToRow(model);
  }

  /**
   * Find a quilt by ID
   * 
   * Caching: 5 minutes (frequently accessed, moderate update frequency)
   * Cache tags: 'quilts', 'quilts-{id}'
   * 
   * Requirements: 9.2 - Next.js 16 caching
   */
  async findById(id: string): Promise<Quilt | null> {
    'use cache';
    cacheLife('minutes'); // 5 minutes
    cacheTag('quilts', `quilts-${id}`);
    
    return this.executeQuery(
      async () => {
        const rows = (await sql`
          SELECT * FROM quilts
          WHERE id = ${id}
        `) as QuiltRow[];
        return rows[0] ? this.rowToModel(rows[0]) : null;
      },
      'findById',
      { id }
    );
  }

  /**
   * Helper method to execute a sorted query based on the sortBy field
   *
   * Since Neon's tagged template literals don't allow dynamic column names for security,
   * we use a switch statement to select the appropriate query with the correct ORDER BY clause.
   * This ensures SQL injection safety while supporting database-level sorting.
   *
   * Requirements: 14.1 - Sort-before-paginate
   */
  private async executeSortedQuery(
    whereClause: string,
    params: Record<string, unknown>,
    sortBy: QuiltSortField,
    sortOrder: SortOrder,
    limit: number,
    offset: number
  ): Promise<QuiltRow[]> {
    const { season, status, locationPattern, brandPattern, searchPattern } = params;
    const isAsc = sortOrder === 'asc';

    // Helper to execute query with specific ORDER BY
    // We use separate queries for each sort field to maintain SQL injection safety
    const executeWithSort = async (): Promise<QuiltRow[]> => {
      // Build WHERE conditions
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
        case 'season':
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
                ORDER BY season ASC
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
                ORDER BY season DESC
                LIMIT ${limit} OFFSET ${offset}
              `) as QuiltRow[]);
        case 'weightGrams':
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
                ORDER BY weight_grams ASC NULLS LAST
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
                ORDER BY weight_grams DESC NULLS LAST
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
        case 'updatedAt':
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
                ORDER BY updated_at ASC
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
                ORDER BY updated_at DESC
                LIMIT ${limit} OFFSET ${offset}
              `) as QuiltRow[]);
        default:
          // Default to createdAt DESC for backwards compatibility
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
    };

    return executeWithSort();
  }

  /**
   * Find all quilts with optional filtering and sorting - optimized with database-level operations
   *
   * This method builds dynamic WHERE clauses to filter at the database level,
   * and applies ORDER BY before LIMIT/OFFSET to ensure correct pagination.
   * 
   * Caching: 2 minutes (list data, frequent updates)
   * Cache tags: 'quilts', 'quilts-list', plus specific tags based on filters
   *
   * Requirements: 6.1 - Database-level filtering
   * Requirements: 14.1 - Sort-before-paginate
   * Requirements: 9.2 - Next.js 16 caching
   */
  async findAll(filters: QuiltFilters = {}): Promise<Quilt[]> {
    'use cache';
    cacheLife('seconds'); // 2 minutes (120 seconds)
    
    // Build cache tags based on filters
    const tags = ['quilts', 'quilts-list'];
    if (filters.status) tags.push(`quilts-status-${filters.status}`);
    if (filters.season) tags.push(`quilts-season-${filters.season}`);
    cacheTag(...tags);
    
    return this.executeQuery(
      async () => {
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

        // Validate sortBy to prevent SQL injection (whitelist approach)
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
        const rows = await this.executeSortedQuery(
          '', // whereClause is built inside executeSortedQuery
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

        return rows.map(row => this.rowToModel(row));
      },
      'findAll',
      { filters }
    );
  }

  /**
   * Find quilts by status
   * 
   * Caching: 2 minutes (status-specific queries)
   * Cache tags: 'quilts', 'quilts-status-{status}'
   * 
   * Requirements: 9.2 - Next.js 16 caching
   */
  async findByStatus(status: QuiltStatus): Promise<Quilt[]> {
    'use cache';
    cacheLife('seconds'); // 2 minutes
    cacheTag('quilts', `quilts-status-${status}`);
    
    return this.executeQuery(
      async () => {
        const rows = (await sql`
          SELECT * FROM quilts
          WHERE current_status = ${status}
          ORDER BY created_at DESC
        `) as QuiltRow[];
        return rows.map(row => this.rowToModel(row));
      },
      'findByStatus',
      { status }
    );
  }

  /**
   * Find quilts by season
   * 
   * Caching: 5 minutes (seasonal data changes infrequently)
   * Cache tags: 'quilts', 'quilts-season-{season}'
   * 
   * Requirements: 9.2 - Next.js 16 caching
   */
  async findBySeason(season: Season): Promise<Quilt[]> {
    'use cache';
    cacheLife('minutes'); // 5 minutes
    cacheTag('quilts', `quilts-season-${season}`);
    
    return this.executeQuery(
      async () => {
        const rows = (await sql`
          SELECT * FROM quilts
          WHERE season = ${season}
          ORDER BY created_at DESC
        `) as QuiltRow[];
        return rows.map(row => this.rowToModel(row));
      },
      'findBySeason',
      { season }
    );
  }

  /**
   * Get the next available item number
   */
  async getNextItemNumber(): Promise<number> {
    return this.executeQuery(async () => {
      const result = (await sql`
          SELECT COALESCE(MAX(item_number), 0) + 1 as next_number
          FROM quilts
        `) as [{ next_number: number }];
      return result[0]?.next_number || 1;
    }, 'getNextItemNumber');
  }

  /**
   * Generate a quilt name based on its properties
   */
  generateQuiltName(data: CreateQuiltData): string {
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
   * Create a new quilt
   * 
   * Cache invalidation: Invalidates 'quilts', 'quilts-list', status and season specific tags
   * 
   * Requirements: 9.2 - Next.js 16 cache invalidation
   */
  async create(data: CreateQuiltData): Promise<Quilt> {
    return this.executeQuery(
      async () => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const itemNumber = await this.getNextItemNumber();
        const name = data.name || this.generateQuiltName(data);

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

        const quilt = this.rowToModel(rows[0]);
        
        // Invalidate cache tags
        updateTag('quilts');
        updateTag('quilts-list');
        updateTag(`quilts-status-${quilt.currentStatus}`);
        updateTag(`quilts-season-${quilt.season}`);

        dbLogger.info('Quilt created successfully', { id, itemNumber });
        return quilt;
      },
      'create',
      { data }
    );
  }

  /**
   * Update a quilt
   * 
   * Cache invalidation: Invalidates specific quilt, list, and related status/season tags
   * 
   * Requirements: 9.2 - Next.js 16 cache invalidation
   */
  async update(id: string, data: Partial<CreateQuiltData>): Promise<Quilt | null> {
    return this.executeQuery(
      async () => {
        // Get current quilt
        const current = await this.findById(id);
        if (!current) {
          dbLogger.warn('Quilt not found for update', { id });
          return null;
        }

        const now = new Date().toISOString();
        const rowData = this.modelToRow({ ...current, ...data, updatedAt: new Date(now) });

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

        const updated = this.rowToModel(rows[0]);
        
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
      },
      'update',
      { id, data }
    );
  }

  /**
   * Update quilt status only (without usage record management)
   * 
   * Cache invalidation: Invalidates specific quilt and status tags
   *
   * @deprecated Use updateStatusWithUsageRecord for atomic status changes with usage tracking
   * 
   * Requirements: 9.2 - Next.js 16 cache invalidation
   */
  async updateStatus(id: string, status: QuiltStatus): Promise<Quilt | null> {
    return this.executeQuery(
      async () => {
        // Get current status for cache invalidation
        const current = await this.findById(id);
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

        const updated = this.rowToModel(rows[0]);
        
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
      },
      'updateStatus',
      { id, status }
    );
  }

  /**
   * Update quilt status with atomic usage record management
   *
   * This method ensures that status changes and usage record operations
   * are executed atomically within a database transaction.
   *
   * Requirements: 13.1 - Status change atomicity
   * Requirements: 13.2 - Single active usage record
   *
   * Behavior:
   * - When changing TO IN_USE: Creates a new usage record with start_date
   * - When changing FROM IN_USE: Ends the active usage record with end_date
   * - Validates that only one active usage record exists for IN_USE quilts
   *
   * @param id - The quilt ID
   * @param newStatus - The new status to set
   * @param usageType - Optional usage type (defaults to 'REGULAR')
   * @param notes - Optional notes for the usage record
   * @returns Object containing the updated quilt and usage record (if applicable)
   */
  async updateStatusWithUsageRecord(
    id: string,
    newStatus: QuiltStatus,
    usageType: UsageType = 'REGULAR',
    notes?: string
  ): Promise<{
    quilt: Quilt;
    usageRecord?: { id: string; quiltId: string; startDate: Date; endDate: Date | null };
  }> {
    return this.executeQuery(
      async () => {
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

          const currentQuilt = this.rowToModel(currentRows[0]);
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
          // End the active usage record
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
          // Create a new usage record
          if (newStatus === 'IN_USE' && previousStatus !== 'IN_USE') {
            // First, verify no active usage record exists (Requirements: 13.2)
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

          const updatedQuilt = this.rowToModel(updatedRows[0]);
          dbLogger.info('Quilt status updated atomically', {
            id,
            previousStatus,
            newStatus,
            hasUsageRecord: !!usageRecord,
          });

          return { quilt: updatedQuilt, usageRecord };
        });
      },
      'updateStatusWithUsageRecord',
      { id, newStatus, usageType }
    );
  }

  /**
   * Get the count of active usage records for a quilt
   *
   * Requirements: 13.2 - Single active usage record validation
   *
   * @param quiltId - The quilt ID to check
   * @returns The count of active usage records (should be 0 or 1)
   */
  async getActiveUsageRecordCount(quiltId: string): Promise<number> {
    return this.executeQuery(
      async () => {
        const result = (await sql`
          SELECT COUNT(*) as count FROM usage_records
          WHERE quilt_id = ${quiltId} AND end_date IS NULL
        `) as [{ count: string }];

        return parseInt(result[0]?.count || '0', 10);
      },
      'getActiveUsageRecordCount',
      { quiltId }
    );
  }

  /**
   * Delete a quilt and its related records
   * 
   * Cache invalidation: Invalidates all quilt-related caches
   * 
   * Requirements: 9.2 - Next.js 16 cache invalidation
   */
  async delete(id: string): Promise<boolean> {
    return this.executeQuery(
      async () => {
        // Get quilt info for cache invalidation before deletion
        const quilt = await this.findById(id);
        
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
      },
      'delete',
      { id }
    );
  }

  /**
   * Count quilts with optional filters - optimized with database-level filtering
   *
   * This method uses SQL COUNT with WHERE clauses to count at the database level,
   * avoiding fetching all records into memory.
   *
   * Requirements: 6.3 - Optimized count queries
   */
  async count(filters: QuiltFilters = {}): Promise<number> {
    return this.executeQuery(
      async () => {
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
        // Season only
        else if (
          hasSeasonFilter &&
          !hasStatusFilter &&
          !hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE season = ${season}
          `) as [{ count: string }];
        }
        // Status only
        else if (
          !hasSeasonFilter &&
          hasStatusFilter &&
          !hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE current_status = ${status}
          `) as [{ count: string }];
        }
        // Location only (case-insensitive LIKE)
        else if (
          !hasSeasonFilter &&
          !hasStatusFilter &&
          hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          const locationPattern = `%${location.toLowerCase()}%`;
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE LOWER(location) LIKE ${locationPattern}
          `) as [{ count: string }];
        }
        // Brand only (case-insensitive LIKE)
        else if (
          !hasSeasonFilter &&
          !hasStatusFilter &&
          !hasLocationFilter &&
          hasBrandFilter &&
          !hasSearchFilter
        ) {
          const brandPattern = `%${brand.toLowerCase()}%`;
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE LOWER(brand) LIKE ${brandPattern}
          `) as [{ count: string }];
        }
        // Search only (case-insensitive search across multiple fields)
        else if (
          !hasSeasonFilter &&
          !hasStatusFilter &&
          !hasLocationFilter &&
          !hasBrandFilter &&
          hasSearchFilter
        ) {
          const searchPattern = `%${search.toLowerCase()}%`;
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE LOWER(name) LIKE ${searchPattern}
               OR LOWER(color) LIKE ${searchPattern}
               OR LOWER(fill_material) LIKE ${searchPattern}
               OR LOWER(COALESCE(notes, '')) LIKE ${searchPattern}
          `) as [{ count: string }];
        }
        // Season + Status
        else if (
          hasSeasonFilter &&
          hasStatusFilter &&
          !hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE season = ${season}
              AND current_status = ${status}
          `) as [{ count: string }];
        }
        // Season + Location
        else if (
          hasSeasonFilter &&
          !hasStatusFilter &&
          hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          const locationPattern = `%${location.toLowerCase()}%`;
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE season = ${season}
              AND LOWER(location) LIKE ${locationPattern}
          `) as [{ count: string }];
        }
        // Status + Location
        else if (
          !hasSeasonFilter &&
          hasStatusFilter &&
          hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          const locationPattern = `%${location.toLowerCase()}%`;
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE current_status = ${status}
              AND LOWER(location) LIKE ${locationPattern}
          `) as [{ count: string }];
        }
        // Season + Status + Location
        else if (
          hasSeasonFilter &&
          hasStatusFilter &&
          hasLocationFilter &&
          !hasBrandFilter &&
          !hasSearchFilter
        ) {
          const locationPattern = `%${location.toLowerCase()}%`;
          result = (await sql`
            SELECT COUNT(*) as count FROM quilts
            WHERE season = ${season}
              AND current_status = ${status}
              AND LOWER(location) LIKE ${locationPattern}
          `) as [{ count: string }];
        }
        // Complex filter with search - use comprehensive query
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
      },
      'count',
      { filters }
    );
  }
}

// Export singleton instance
export const quiltRepository = new QuiltRepository();
