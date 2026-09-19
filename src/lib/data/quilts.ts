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
 * - Cache invalidation with revalidateTag(, 'max')
 *
 * Cache Strategy:
 * - Individual items: `moduleItem` profile (revalidate 5 minutes)
 * - Lists: `moduleList` profile (revalidate 2 minutes)
 * - Tags: 'quilts', 'quilts-{id}', 'quilts-status-{status}', 'quilts-season-{season}'
 *
 * Requirements: 2.1-2.6, 3.1-3.6 from Next.js 16 Best Practices Migration spec
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { db, Tx } from '@/db';
import { quilts, usageRecords } from '@/db/schema';
import { eq, sql, desc, and, isNull } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { ConflictError, RecordNotFoundError } from '@/lib/data/errors';
import { containsInsensitiveFilter, searchAnyColumn } from '@/lib/data/search';
import { type Quilt } from '@/lib/database/types';
import {
  QuiltStatus,
  Season,
  UsageType,
  collectQuiltBusinessRuleIssues,
  type QuiltBusinessRuleIssue,
} from '@/lib/validations/quilt';
import { quiltsCacheTags, usageCacheTags, statsCacheTags } from '@/modules/core/cache-tags';

// ============================================================================
// Errors
// ============================================================================

/**
 * Thrown when a quilt write would violate a cross-field business rule that the
 * request-level Zod schema cannot evaluate on its own, because the rule needs the
 * stored row (for example a PATCH that changes only `season`).
 *
 * Carries `fieldErrors` so the Action layer can surface it as a normal validation
 * failure instead of a 500.
 */
export class QuiltBusinessRuleError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(issues: QuiltBusinessRuleIssue[]) {
    super('Quilt business rule validation failed');
    this.name = 'QuiltBusinessRuleError';

    const fieldErrors: Record<string, string[]> = {};
    for (const issue of issues) {
      const key = String(issue.path[0] ?? 'root');
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }
    this.fieldErrors = fieldErrors;
  }
}

// ============================================================================
// Types
// ============================================================================

export type QuiltSortField =
  'itemNumber' | 'name' | 'season' | 'weightGrams' | 'createdAt' | 'updatedAt';

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

export type SaveQuiltData =
  | (CreateQuiltData & {
      id?: undefined;
      usageType?: UsageType;
      usageNotes?: string;
    })
  | (Partial<CreateQuiltData> & {
      id: string;
      usageType?: UsageType;
      usageNotes?: string;
    });

interface UsageRecordSyncResult {
  id: string;
  quiltId: string;
  startDate: Date;
  endDate: Date | null;
}

interface UsageRecordTransitionOverrides {
  startDate?: Date;
  endDate?: Date;
}

type QuiltMutationValues = Partial<typeof quilts.$inferInsert>;

function logQuiltDataError(message: string, error: unknown, meta?: Record<string, unknown>) {
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

function summarizeQuiltWriteData(data: Partial<CreateQuiltData>) {
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

function isQuiltUpdateData(data: SaveQuiltData): data is Extract<SaveQuiltData, { id: string }> {
  return 'id' in data && typeof data.id === 'string' && data.id.length > 0;
}

function buildQuiltUpdateValues(data: Partial<CreateQuiltData>): QuiltMutationValues {
  const updateValues: QuiltMutationValues = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateValues.name = data.name;
  if (data.season !== undefined) updateValues.season = data.season;
  if (data.lengthCm !== undefined) updateValues.lengthCm = data.lengthCm;
  if (data.widthCm !== undefined) updateValues.widthCm = data.widthCm;
  if (data.weightGrams !== undefined) updateValues.weightGrams = data.weightGrams;
  if (data.fillMaterial !== undefined) updateValues.fillMaterial = data.fillMaterial;
  if (data.materialDetails !== undefined) updateValues.materialDetails = data.materialDetails;
  if (data.color !== undefined) updateValues.color = data.color;
  if (data.brand !== undefined) updateValues.brand = data.brand;
  if (data.purchaseDate !== undefined) updateValues.purchaseDate = data.purchaseDate ?? null;
  if (data.location !== undefined) updateValues.location = data.location;
  if (data.packagingInfo !== undefined) updateValues.packagingInfo = data.packagingInfo;
  if (data.currentStatus !== undefined) updateValues.currentStatus = data.currentStatus;
  if (data.notes !== undefined) updateValues.notes = data.notes;
  if (data.imageUrl !== undefined) updateValues.imageUrl = data.imageUrl;
  if (data.thumbnailUrl !== undefined) updateValues.thumbnailUrl = data.thumbnailUrl;
  if (data.mainImage !== undefined) updateValues.mainImage = data.mainImage;
  if (data.attachmentImages !== undefined) updateValues.attachmentImages = data.attachmentImages;

  return updateValues;
}

async function syncUsageRecordForStatusChange(
  tx: Tx,
  quiltId: string,
  previousStatus: QuiltStatus,
  nextStatus: QuiltStatus,
  usageType: UsageType = 'REGULAR',
  notes?: string,
  overrides: UsageRecordTransitionOverrides = {}
): Promise<UsageRecordSyncResult | undefined> {
  let usageRecordData: UsageRecordSyncResult | undefined;

  if (previousStatus === nextStatus) {
    return usageRecordData;
  }

  if (previousStatus === 'IN_USE' && nextStatus !== 'IN_USE') {
    const endedRows = await tx
      .update(usageRecords)
      .set({
        endDate: overrides.endDate ?? new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)))
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

  if (nextStatus === 'IN_USE' && previousStatus !== 'IN_USE') {
    const activeCount = await tx
      .select({ count: sql<number>`count(*)` })
      .from(usageRecords)
      .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)));

    if (Number(activeCount[0].count) > 0) {
      throw new ConflictError('Quilt', 'Quilt already has an active usage record');
    }

    const createdRows = await tx
      .insert(usageRecords)
      .values({
        quiltId,
        startDate: overrides.startDate ?? new Date(),
        usageType,
        notes,
      })
      .returning();

    if (createdRows.length > 0) {
      usageRecordData = {
        id: createdRows[0].id,
        quiltId: createdRows[0].quiltId,
        startDate: createdRows[0].startDate,
        endDate: createdRows[0].endDate,
      };
    }
  }

  return usageRecordData;
}

function invalidateUsageAndStatsTags(quiltId: string) {
  revalidateTag(usageCacheTags.root, 'max');
  revalidateTag(usageCacheTags.list, 'max');
  revalidateTag(usageCacheTags.slice('active', 'true'), 'max');
  revalidateTag(usageCacheTags.slice('quilt', quiltId), 'max');
  revalidateTag(statsCacheTags.root, 'max');
  revalidateTag(statsCacheTags.slice('dashboard', 'main'), 'max');
}

interface QuiltInvalidationInput {
  id: string;
  statuses?: QuiltStatus[];
  seasons?: Season[];
  usageChanged?: boolean;
}

/**
 * Invalidate every cache tag affected by a quilt write.
 *
 * Contract: call this only AFTER the surrounding transaction has committed.
 * `revalidateTag` does not participate in the transaction rollback, so running
 * it inside a transaction would clear caches for writes that never persisted.
 */
function invalidateQuiltWriteTags({
  id,
  statuses = [],
  seasons = [],
  usageChanged = false,
}: QuiltInvalidationInput) {
  revalidateTag(quiltsCacheTags.root, 'max');
  revalidateTag(quiltsCacheTags.list, 'max');
  revalidateTag(quiltsCacheTags.item(id), 'max');

  for (const status of new Set(statuses)) {
    revalidateTag(quiltsCacheTags.slice('status', status), 'max');
  }

  for (const season of new Set(seasons)) {
    revalidateTag(quiltsCacheTags.slice('season', season), 'max');
  }

  revalidateTag(statsCacheTags.root, 'max');
  revalidateTag(statsCacheTags.slice('dashboard', 'main'), 'max');

  if (usageChanged) {
    invalidateUsageAndStatsTags(id);
  }
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
// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get quilt by ID
 *
 * Cache: `moduleItem` profile (revalidate 5 minutes)
 * Tags: 'quilts', 'quilts-{id}'
 */
export async function getQuiltById(id: string): Promise<Quilt | null> {
  'use cache';
  cacheLife('moduleItem');
  cacheTag(quiltsCacheTags.root, quiltsCacheTags.item(id));

  try {
    const result = await db.select().from(quilts).where(eq(quilts.id, id));
    return result[0] ? (result[0] as unknown as Quilt) : null;
  } catch (error) {
    logQuiltDataError('Error fetching quilt by ID', error, { id });
    throw error;
  }
}

/**
 * Get all quilts with filters
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 * Tags: 'quilts', 'quilts-list', plus dynamic tags based on filters
 */
export async function getQuilts(filters: QuiltFilters = {}): Promise<Quilt[]> {
  'use cache';
  cacheLife('moduleList');

  // Build cache tags based on filters
  const tags = [quiltsCacheTags.root, quiltsCacheTags.list];
  if (filters.status) tags.push(quiltsCacheTags.slice('status', filters.status));
  if (filters.season) tags.push(quiltsCacheTags.slice('season', filters.season));
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
    const locationCondition = containsInsensitiveFilter(quilts.location, location);
    if (locationCondition) conditions.push(locationCondition);

    const brandCondition = containsInsensitiveFilter(quilts.brand, brand);
    if (brandCondition) conditions.push(brandCondition);

    const searchCondition = searchAnyColumn(
      [quilts.name, quilts.color, quilts.fillMaterial, quilts.notes],
      search
    );
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort mapping
    const sortColumn =
      {
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
    logQuiltDataError('Error fetching quilts', error, { filters });
    throw error;
  }
}

/**
 * Get quilts by status
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 * Tags: 'quilts', 'quilts-status-{status}'
 */
export async function getQuiltsByStatus(status: QuiltStatus): Promise<Quilt[]> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(quiltsCacheTags.root, quiltsCacheTags.slice('status', status));

  try {
    const result = await db
      .select()
      .from(quilts)
      .where(eq(quilts.currentStatus, status))
      .orderBy(desc(quilts.createdAt));

    return result as unknown as Quilt[];
  } catch (error) {
    logQuiltDataError('Error fetching quilts by status', error, { status });
    throw error;
  }
}

/**
 * Get quilts by season
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 * Tags: 'quilts', 'quilts-season-{season}'
 */
export async function getQuiltsBySeason(season: Season): Promise<Quilt[]> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(quiltsCacheTags.root, quiltsCacheTags.slice('season', season));

  try {
    const result = await db
      .select()
      .from(quilts)
      .where(eq(quilts.season, season))
      .orderBy(desc(quilts.createdAt));

    return result as unknown as Quilt[];
  } catch (error) {
    logQuiltDataError('Error fetching quilts by season', error, { season });
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
    const locationCondition = containsInsensitiveFilter(quilts.location, location);
    if (locationCondition) conditions.push(locationCondition);

    const brandCondition = containsInsensitiveFilter(quilts.brand, brand);
    if (brandCondition) conditions.push(brandCondition);

    const searchCondition = searchAnyColumn(
      [quilts.name, quilts.color, quilts.fillMaterial, quilts.notes],
      search
    );
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(quilts)
      .where(whereClause);

    return Number(result[0]?.count || 0);
  } catch (error) {
    logQuiltDataError('Error counting quilts', error, { filters });
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
  const result = await saveQuilt(data);
  return result.quilt;
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
    const result = await saveQuilt({ id, ...data });
    return result.quilt;
  } catch (error) {
    if (error instanceof RecordNotFoundError) return null;
    throw error;
  }
}

/**
 * Save a quilt via a single mutation path.
 *
 * - Create path: inserts quilt and creates usage record when initial status is IN_USE
 * - Update path: updates quilt metadata and keeps usage records in sync when status changes
 */
export async function saveQuilt(
  data: SaveQuiltData
): Promise<{ quilt: Quilt; usageRecord?: UsageRecordSyncResult }> {
  try {
    if (isQuiltUpdateData(data)) {
      const { quilt, usageRecord, previousStatus, previousSeason } = await db.transaction(
        async tx => {
          // `FOR UPDATE` because the pre-read status and season decide which cache
          // slices get invalidated after commit; without the lock two concurrent
          // writes could both observe the old values and leave a slice stale.
          const currentRows = await tx
            .select()
            .from(quilts)
            .where(eq(quilts.id, data.id))
            .limit(1)
            .for('update');

          if (currentRows.length === 0) {
            throw new RecordNotFoundError('Quilt', data.id);
          }

          const currentQuilt = currentRows[0] as unknown as Quilt;

          // Cross-field business rules are re-checked on the patch MERGED onto the
          // stored row. The request-level `updateQuiltSchema` can only see the fields
          // the caller supplied, so without this a record created legally could be
          // PATCHed into a state that `createQuiltSchema` itself rejects (e.g. changing
          // only `season` while the stored `weightGrams` is out of the new season's range).
          // Runs before any write, inside the transaction, so a violation aborts cleanly.
          const businessRuleIssues = collectQuiltBusinessRuleIssues({
            season: data.season ?? currentQuilt.season,
            weightGrams: data.weightGrams ?? currentQuilt.weightGrams,
            lengthCm: data.lengthCm ?? currentQuilt.lengthCm,
            widthCm: data.widthCm ?? currentQuilt.widthCm,
          });

          if (businessRuleIssues.length > 0) {
            throw new QuiltBusinessRuleError(businessRuleIssues);
          }

          const nextStatus = data.currentStatus ?? currentQuilt.currentStatus;
          const syncedUsageRecord = await syncUsageRecordForStatusChange(
            tx,
            data.id,
            currentQuilt.currentStatus,
            nextStatus,
            data.usageType ?? 'REGULAR',
            data.usageNotes
          );

          const updateValues = buildQuiltUpdateValues({
            ...data,
            currentStatus: nextStatus,
          });

          const updatedRows = await tx
            .update(quilts)
            .set(updateValues)
            .where(eq(quilts.id, data.id))
            .returning();

          if (updatedRows.length === 0) {
            throw new Error('Failed to update quilt');
          }

          return {
            quilt: updatedRows[0] as unknown as Quilt,
            usageRecord: syncedUsageRecord,
            previousStatus: currentQuilt.currentStatus,
            previousSeason: currentQuilt.season,
          };
        }
      );

      // Cache invalidation happens after commit: it must not be part of the transaction.
      invalidateQuiltWriteTags({
        id: quilt.id,
        statuses: [previousStatus, quilt.currentStatus],
        seasons: [previousSeason, quilt.season],
        usageChanged: previousStatus !== quilt.currentStatus,
      });

      return { quilt, usageRecord };
    }

    const { quilt, usageRecord } = await db.transaction(async tx => {
      const name = data.name || generateQuiltName(data);

      const insertedRows = await tx
        .insert(quilts)
        .values({
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
          attachmentImages: data.attachmentImages ?? [],
        })
        .returning();

      if (insertedRows.length === 0) {
        throw new Error('Failed to create quilt');
      }

      const createdQuilt = insertedRows[0] as unknown as Quilt;
      const syncedUsageRecord = await syncUsageRecordForStatusChange(
        tx,
        createdQuilt.id,
        'STORAGE',
        createdQuilt.currentStatus,
        data.usageType ?? 'REGULAR',
        data.usageNotes
      );

      return { quilt: createdQuilt, usageRecord: syncedUsageRecord };
    });

    // Cache invalidation happens after commit: it must not be part of the transaction.
    invalidateQuiltWriteTags({
      id: quilt.id,
      statuses: [quilt.currentStatus],
      seasons: [quilt.season],
      usageChanged: quilt.currentStatus === 'IN_USE',
    });

    return { quilt, usageRecord };
  } catch (error) {
    // A business-rule rejection is expected user input, not a data-layer failure, so it
    // is rethrown without being logged as a database error (it would otherwise pollute
    // error-level alerting with ordinary validation misses).
    if (error instanceof QuiltBusinessRuleError) {
      throw error;
    }

    logQuiltDataError('Error saving quilt', error, {
      data: summarizeQuiltWriteData(data),
      id: isQuiltUpdateData(data) ? data.id : undefined,
    });
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
  notes?: string,
  overrides: UsageRecordTransitionOverrides = {}
): Promise<{
  quilt: Quilt;
  usageRecord?: { id: string; quiltId: string; startDate: Date; endDate: Date | null };
}> {
  try {
    const { quilt, usageRecord, previousStatus, statusChanged } = await db.transaction(async tx => {
      // Get current quilt
      const currentRows = await tx
        .select()
        .from(quilts)
        .where(eq(quilts.id, id))
        .limit(1)
        .for('update');

      if (currentRows.length === 0) throw new RecordNotFoundError('Quilt', id);

      const currentQuilt = currentRows[0] as unknown as Quilt;
      const currentStatus = currentQuilt.currentStatus;

      if (currentStatus === newStatus) {
        return {
          quilt: currentQuilt,
          usageRecord: undefined,
          previousStatus: currentStatus,
          statusChanged: false,
        };
      }

      const usageRecordData = await syncUsageRecordForStatusChange(
        tx,
        id,
        currentStatus,
        newStatus,
        usageType,
        notes,
        overrides
      );

      // Update Quilt Status
      const updatedRows = await tx
        .update(quilts)
        .set({
          currentStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(quilts.id, id))
        .returning();

      if (updatedRows.length === 0) throw new Error('Failed to update quilt status');

      return {
        quilt: updatedRows[0] as unknown as Quilt,
        usageRecord: usageRecordData,
        previousStatus: currentStatus,
        statusChanged: true,
      };
    });

    if (statusChanged) {
      // Cache invalidation happens after commit: it must not be part of the transaction.
      invalidateQuiltWriteTags({
        id,
        statuses: [previousStatus, newStatus],
        usageChanged: true,
      });
    }

    return { quilt, usageRecord };
  } catch (error) {
    logQuiltDataError('Error updating quilt status with usage record', error, { id, newStatus });
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

    if (!quilt) {
      dbLogger.warn('Quilt not found for delete', { id });
      return false;
    }

    // Using transaction for cascade delete safety, though constraints handle it usually.
    await db.transaction(async tx => {
      // Manual delete if cascade not set or just to be safe
      await tx.delete(usageRecords).where(eq(usageRecords.quiltId, id));
      // Maintenance records not imported but assumed
      // await tx.delete(maintenanceRecords).where(eq(maintenanceRecords.quiltId, id));

      await tx.delete(quilts).where(eq(quilts.id, id));
    });

    // Invalidate (after the transaction committed)
    invalidateQuiltWriteTags({
      id,
      statuses: [quilt.currentStatus],
      seasons: [quilt.season],
      usageChanged: true,
    });

    dbLogger.info('Quilt deleted successfully', { id });
    return true;
  } catch (error) {
    logQuiltDataError('Error deleting quilt', error, { id });
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
    logQuiltDataError('Error getting active usage record count', error, { quiltId });
    throw error;
  }
}

// ============================================================================
// Helper: Sorted Query Execution
// ============================================================================
// Removed in favor of Drizzle's dynamic orderBy which is much cleaner.
