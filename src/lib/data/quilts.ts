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
  cacheLife,
  cacheTag,
  updateTag,
} from 'next/cache';

import { db, Tx } from '@/db';
import { quilts, usageRecords, maintenanceRecords } from '@/db/schema';
import { eq, sql, desc, and, isNull, like, or } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import {
  type Quilt,
  type UsageRecord,
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
async function getNextItemNumber(tx?: Tx): Promise<number> {
  const connection = tx || db;
  const result = await connection.select({ 
    next_number: sql<number>`COALESCE(MAX(${quilts.itemNumber}), 0) + 1` 
  }).from(quilts);
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
    const result = await db.select().from(quilts).where(eq(quilts.id, id));
    return result[0] ? (result[0] as unknown as Quilt) : null;
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

    // Build query
    const conditions = [];
    if (season) conditions.push(eq(quilts.season, season));
    if (status) conditions.push(eq(quilts.currentStatus, status));
    if (location) conditions.push(like(sql`LOWER(${quilts.location})`, `%${location.toLowerCase()}%`));
    if (brand) conditions.push(like(sql`LOWER(${quilts.brand})`, `%${brand.toLowerCase()}%`));
    
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        like(sql`LOWER(${quilts.name})`, searchLower),
        like(sql`LOWER(${quilts.color})`, searchLower),
        like(sql`LOWER(${quilts.fillMaterial})`, searchLower),
        like(sql`LOWER(${quilts.notes})`, searchLower)
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Sort mapping
    const sortColumn = {
      itemNumber: quilts.itemNumber,
      name: quilts.name,
      season: quilts.season,
      weightGrams: quilts.weightGrams,
      createdAt: quilts.createdAt,
      updatedAt: quilts.updatedAt,
    }[sortBy] || quilts.createdAt;

    const result = await db
      .select()
      .from(quilts)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? sortColumn : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    return result as unknown as Quilt[];
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
    const result = await db
      .select()
      .from(quilts)
      .where(eq(quilts.currentStatus, status))
      .orderBy(desc(quilts.createdAt));

    return result as unknown as Quilt[];
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
    const result = await db
      .select()
      .from(quilts)
      .where(eq(quilts.season, season))
      .orderBy(desc(quilts.createdAt));

    return result as unknown as Quilt[];
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

    // Build query conditions
    const conditions = [];
    if (season) conditions.push(eq(quilts.season, season));
    if (status) conditions.push(eq(quilts.currentStatus, status));
    if (location) conditions.push(like(sql`LOWER(${quilts.location})`, `%${location.toLowerCase()}%`));
    if (brand) conditions.push(like(sql`LOWER(${quilts.brand})`, `%${brand.toLowerCase()}%`));
    
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(or(
        like(sql`LOWER(${quilts.name})`, searchLower),
        like(sql`LOWER(${quilts.color})`, searchLower),
        like(sql`LOWER(${quilts.fillMaterial})`, searchLower),
        like(sql`LOWER(${quilts.notes})`, searchLower)
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(quilts)
      .where(whereClause);

    return Number(result[0]?.count || 0);
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
    // We let Drizzle generate UUID if not provided, but here we can't easily.
    // Drizzle defaultRandom() works on db level.
    const itemNumber = await getNextItemNumber();
    const name = data.name || generateQuiltName(data);

    dbLogger.info('Creating quilt', { itemNumber, name });

    const result = await db.insert(quilts).values({
      // id will be auto-generated
      itemNumber,
      name,
      season: data.season,
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      weightGrams: data.weightGrams,
      fillMaterial: data.fillMaterial,
      materialDetails: data.materialDetails,
      color: data.color,
      brand: data.brand,
      purchaseDate: data.purchaseDate ?? null,
      location: data.location,
      packagingInfo: data.packagingInfo,
      currentStatus: data.currentStatus || 'STORAGE',
      notes: data.notes,
      imageUrl: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl,
      mainImage: data.mainImage,
      attachmentImages: data.attachmentImages as any, // Cast JSON array
    }).returning();

    const quilt = result[0] as unknown as Quilt;

    // Invalidate cache tags
    updateTag('quilts');
    updateTag('quilts-list');
    updateTag(`quilts-status-${quilt.currentStatus}`);
    updateTag(`quilts-season-${quilt.season}`);

    dbLogger.info('Quilt created successfully', { id: quilt.id, itemNumber });
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

    dbLogger.info('Updating quilt', { id });

    const result = await db.update(quilts)
      .set({
        ...data,
        updatedAt: new Date(),
        // Handle image updates carefully if needed, but Drizzle partial update is safe
      })
      .where(eq(quilts.id, id))
      .returning();

    if (result.length === 0) return null;

    const updated = result[0] as unknown as Quilt;

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
    const current = await getQuiltById(id);
    const oldStatus = current?.currentStatus;

    const result = await db.update(quilts)
      .set({
        currentStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(quilts.id, id))
      .returning();

    if (result.length === 0) return null;

    const updated = result[0] as unknown as Quilt;

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
    return await db.transaction(async (tx) => {
      // Get current quilt
      const currentRows = await tx.select().from(quilts).where(eq(quilts.id, id));
      if (currentRows.length === 0) throw new Error('Quilt not found');
      
      const currentQuilt = currentRows[0] as unknown as Quilt;
      const previousStatus = currentQuilt.currentStatus;

      if (previousStatus === newStatus) {
        return { quilt: currentQuilt };
      }

      let usageRecordData: any = undefined;

      // FROM IN_USE -> End usage record
      if (previousStatus === 'IN_USE' && newStatus !== 'IN_USE') {
        const endedRows = await tx.update(usageRecords)
          .set({
            endDate: new Date(),
            updatedAt: new Date(),
          })
          .where(and(
            eq(usageRecords.quiltId, id),
            isNull(usageRecords.endDate)
          ))
          .returning();

        if (endedRows.length > 0) {
          usageRecordData = {
            id: endedRows[0].id,
            quiltId: endedRows[0].quiltId,
            startDate: endedRows[0].startDate,
            endDate: endedRows[0].endDate,
          };
        }
      }

      // TO IN_USE -> Create usage record
      if (newStatus === 'IN_USE' && previousStatus !== 'IN_USE') {
        // Check active
        const activeCount = await tx.select({ count: sql<number>`count(*)` })
          .from(usageRecords)
          .where(and(eq(usageRecords.quiltId, id), isNull(usageRecords.endDate)));
          
        if (Number(activeCount[0].count) > 0) {
          throw new Error('Quilt already has an active usage record');
        }

        const createdRows = await tx.insert(usageRecords).values({
          quiltId: id,
          startDate: new Date(),
          usageType: usageType,
          notes: notes,
        }).returning();

        if (createdRows.length > 0) {
          usageRecordData = {
            id: createdRows[0].id,
            quiltId: createdRows[0].quiltId,
            startDate: createdRows[0].startDate,
            endDate: createdRows[0].endDate,
          };
        }
      }

      // Update Quilt Status
      const updatedRows = await tx.update(quilts)
        .set({
          currentStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(quilts.id, id))
        .returning();

       if (updatedRows.length === 0) throw new Error('Failed to update quilt status');
       const updatedQuilt = updatedRows[0] as unknown as Quilt;

       // Invalidate cache tags
      updateTag('quilts');
      updateTag('quilts-list');
      updateTag(`quilts-${id}`);
      updateTag(`quilts-status-${previousStatus}`);
      updateTag(`quilts-status-${newStatus}`);

       return { quilt: updatedQuilt, usageRecord: usageRecordData };
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
    const quilt = await getQuiltById(id);

    // Using transaction for cascade delete safety, though constraints handle it usually.
    await db.transaction(async (tx) => {
        // Manual delete if cascade not set or just to be safe
        await tx.delete(usageRecords).where(eq(usageRecords.quiltId, id));
        // Maintenance records not imported but assumed
        // await tx.delete(maintenanceRecords).where(eq(maintenanceRecords.quiltId, id));
        
        await tx.delete(quilts).where(eq(quilts.id, id));
    });

    // Invalidate
    updateTag('quilts');
    updateTag('quilts-list');
    updateTag(`quilts-${id}`);
    if (quilt) {
        updateTag(`quilts-status-${quilt.currentStatus}`);
        updateTag(`quilts-season-${quilt.season}`);
    }

    dbLogger.info('Quilt deleted successfully', { id });
    return true;
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
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(usageRecords)
      .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)));

    return Number(result[0]?.count || 0);
  } catch (error) {
    dbLogger.error('Error getting active usage record count', { quiltId, error });
    throw error;
  }
}

// ============================================================================
// Helper: Sorted Query Execution
// ============================================================================
// Removed in favor of Drizzle's dynamic orderBy which is much cleaner.
