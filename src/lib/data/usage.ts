/**
 * Usage Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices.
 * Replaces the class-based UsageRepository pattern.
 *
 * Architecture:
 * - Standalone async functions
 * - 'use cache' for persistent caching
 * - React cache() for request deduplication
 * - Cache invalidation with updateTag()
 *
 * Cache Strategy:
 * - Individual records: 5 minutes
 * - Lists/History: 2 minutes (120 seconds)
 * - Tags: 'usage', 'usage-{id}', 'usage-quilt-{quiltId}'
 */

import { cache } from 'react';
import { cacheLife, cacheTag, updateTag } from 'next/cache';
import { db } from '@/db';
import { usageRecords, quilts } from '@/db/schema';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { type UsageRecord } from '@/lib/database/types';
import { UsageType } from '@/lib/validations/quilt';

// ============================================================================
// Types
// ============================================================================

export interface CreateUsageRecordData {
  quiltId: string;
  startDate: Date;
  endDate?: Date | null;
  usageType: UsageType;
  notes?: string | null;
}

export interface UpdateUsageRecordData {
  startDate?: Date;
  endDate?: Date | null;
  usageType?: UsageType;
  notes?: string | null;
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get usage record by ID
 *
 * Cache: 5 minutes
 * Tags: 'usage', 'usage-{id}'
 */
export async function getUsageRecordById(id: string): Promise<UsageRecord | null> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('usage', `usage-${id}`);

  try {
    const result = await db.select().from(usageRecords).where(eq(usageRecords.id, id));
    return result[0] ? (result[0] as unknown as UsageRecord) : null;
  } catch (error) {
    dbLogger.error('Error fetching usage record by ID', { id, error });
    throw error;
  }
}

/**
 * Get usage history for a quilt
 *
 * Cache: 2 minutes
 * Tags: 'usage', 'usage-quilt-{quiltId}'
 */
export async function getUsageHistory(quiltId: string): Promise<UsageRecord[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes
  cacheTag('usage', `usage-quilt-${quiltId}`);

  try {
    const result = await db
      .select()
      .from(usageRecords)
      .where(eq(usageRecords.quiltId, quiltId))
      .orderBy(desc(usageRecords.startDate));

    return result as unknown as UsageRecord[];
  } catch (error) {
    dbLogger.error('Error fetching usage history for quilt', { quiltId, error });
    throw error;
  }
}

/**
 * Get currently active usage record for a quilt
 *
 * Cache: 2 minutes
 * Tags: 'usage', 'usage-quilt-{quiltId}'
 */
export async function getActiveUsageRecord(quiltId: string): Promise<UsageRecord | null> {
  'use cache';
  cacheLife('seconds'); // 2 minutes
  cacheTag('usage', `usage-quilt-${quiltId}`);

  try {
    const result = await db
      .select()
      .from(usageRecords)
      .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)));

    return result[0] ? (result[0] as unknown as UsageRecord) : null;
  } catch (error) {
    dbLogger.error('Error fetching active usage record', { quiltId, error });
    throw error;
  }
}

/**
 * Get ALL active usage records
 *
 * Cache: 2 minutes
 * Tags: 'usage', 'usage-active'
 */
export async function getAllActiveUsageRecords(): Promise<UsageRecord[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes
  cacheTag('usage', 'usage-active');

  try {
    const result = await db
      .select()
      .from(usageRecords)
      .where(isNull(usageRecords.endDate))
      .orderBy(desc(usageRecords.startDate));

    return result as unknown as UsageRecord[];
  } catch (error) {
    dbLogger.error('Error fetching all active usage records', { error });
    throw error;
  }
}

/**
 * Get ALL usage records
 *
 * Cache: 2 minutes
 * Tags: 'usage', 'usage-list'
 */
export async function getUsageRecords(): Promise<UsageRecord[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes
  cacheTag('usage', 'usage-list');

  try {
    const result = await db.select().from(usageRecords).orderBy(desc(usageRecords.startDate));

    return result as unknown as UsageRecord[];
  } catch (error) {
    dbLogger.error('Error fetching all usage records', { error });
    throw error;
  }
}

/**
 * Usage record with joined quilt information
 */
export interface UsageRecordWithQuilt {
  id: string;
  quiltId: string;
  quiltName: string | null;
  itemNumber: number | null;
  color: string | null;
  season: string | null;
  currentStatus: string | null;
  startedAt: Date;
  endedAt: Date | null;
  usageType: string | null;
  notes: string | null;
  isActive: boolean;
  duration: number | null;
}

/**
 * Get ALL usage records with quilt information
 *
 * Cache: 2 minutes
 * Tags: 'usage', 'usage-list'
 */
export async function getUsageRecordsWithQuilts(
  filters: { quiltId?: string; limit?: number; offset?: number } = {}
): Promise<UsageRecordWithQuilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes
  cacheTag('usage', 'usage-list');

  try {
    const { quiltId, limit = 50, offset = 0 } = filters;

    let query = db
      .select({
        id: usageRecords.id,
        quiltId: usageRecords.quiltId,
        startDate: usageRecords.startDate,
        endDate: usageRecords.endDate,
        usageType: usageRecords.usageType,
        notes: usageRecords.notes,
        quiltName: quilts.name,
        itemNumber: quilts.itemNumber,
        color: quilts.color,
        season: quilts.season,
        currentStatus: quilts.currentStatus,
      })
      .from(usageRecords)
      .leftJoin(quilts, sql`${usageRecords.quiltId} = ${quilts.id}`)
      .orderBy(desc(usageRecords.startDate))
      .limit(limit)
      .offset(offset);

    if (quiltId) {
      query = query.where(sql`${usageRecords.quiltId} = ${quiltId}`) as typeof query;
    }

    const rows = await query;

    // Transform to expected format
    return rows.map(row => {
      const endDate = row.endDate ? new Date(row.endDate) : null;
      const startDate = new Date(row.startDate);
      let duration: number | null = null;

      if (endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: row.id,
        quiltId: row.quiltId,
        quiltName: row.quiltName,
        itemNumber: row.itemNumber,
        color: row.color,
        season: row.season,
        currentStatus: row.currentStatus,
        startedAt: startDate,
        endedAt: endDate,
        usageType: row.usageType,
        notes: row.notes,
        isActive: !endDate,
        duration: duration,
      };
    });
  } catch (error) {
    dbLogger.error('Error fetching usage records with quilts', { error });
    throw error;
  }
}

/**
 * Get usage stats for a specific quilt
 *
 * Cache: 2 minutes
 * Tags: 'usage', 'usage-quilt-{quiltId}'
 */
export async function getUsageStats(
  quiltId: string
): Promise<{ totalDays: number; usageCount: number }> {
  'use cache';
  cacheLife('seconds'); // 2 minutes
  cacheTag('usage', `usage-quilt-${quiltId}`);

  try {
    const result = await db
      .select({
        count: sql<number>`count(*)::int`,
        days: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${usageRecords.endDate} IS NOT NULL
          THEN EXTRACT(DAY FROM (${usageRecords.endDate} - ${usageRecords.startDate}))
          ELSE 0
        END
      ), 0)::int`,
      })
      .from(usageRecords)
      .where(eq(usageRecords.quiltId, quiltId));

    return {
      usageCount: result[0]?.count || 0,
      totalDays: result[0]?.days || 0,
    };
  } catch (error) {
    dbLogger.error('Error fetching usage stats for quilt', { quiltId, error });
    throw error;
  }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Create a new usage record
 *
 * Invalidates: 'usage', 'usage-quilt-{quiltId}'
 */
export async function createUsageRecord(data: CreateUsageRecordData): Promise<UsageRecord> {
  try {
    dbLogger.info('Creating usage record', { quiltId: data.quiltId });

    const result = await db
      .insert(usageRecords)
      .values({
        quiltId: data.quiltId,
        startDate: data.startDate,
        endDate: data.endDate,
        usageType: data.usageType,
        notes: data.notes,
      })
      .returning();

    const record = result[0] as unknown as UsageRecord;

    updateTag('usage');
    updateTag(`usage-quilt-${data.quiltId}`);

    // Also invalidate stats as they change
    updateTag('stats');

    dbLogger.info('Usage record created', { id: record.id });
    return record;
  } catch (error) {
    dbLogger.error('Error creating usage record', { data, error });
    throw error;
  }
}

/**
 * Update a usage record
 *
 * Invalidates: 'usage', 'usage-{id}', 'usage-quilt-{quiltId}'
 */
export async function updateUsageRecord(
  id: string,
  data: UpdateUsageRecordData
): Promise<UsageRecord | null> {
  try {
    const current = await getUsageRecordById(id);
    if (!current) return null;

    dbLogger.info('Updating usage record', { id });

    const result = await db
      .update(usageRecords)
      .set({
        startDate: data.startDate,
        endDate: data.endDate,
        usageType: data.usageType,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(usageRecords.id, id))
      .returning();

    if (result.length === 0) return null;
    const updated = result[0] as unknown as UsageRecord;

    updateTag('usage');
    updateTag(`usage-${id}`);
    updateTag(`usage-quilt-${current.quiltId}`);
    updateTag('stats');

    dbLogger.info('Usage record updated', { id });
    return updated;
  } catch (error) {
    dbLogger.error('Error updating usage record', { id, data, error });
    throw error;
  }
}

/**
 * End an active usage record
 */
export async function endUsageRecord(
  id: string,
  endDate: Date = new Date()
): Promise<UsageRecord | null> {
  try {
    const current = await getUsageRecordById(id);
    if (!current) return null;

    dbLogger.info('Ending usage record', { id });

    const result = await db
      .update(usageRecords)
      .set({
        endDate: endDate,
        updatedAt: new Date(),
      })
      .where(eq(usageRecords.id, id))
      .returning();

    if (result.length === 0) return null;
    const updated = result[0] as unknown as UsageRecord;

    updateTag('usage');
    updateTag(`usage-${id}`);
    updateTag(`usage-quilt-${current.quiltId}`);
    updateTag('stats');

    dbLogger.info('Usage record ended', { id });
    return updated;
  } catch (error) {
    dbLogger.error('Error ending usage record', { id, error });
    throw error;
  }
}

/**
 * Delete a usage record
 */
export async function deleteUsageRecord(id: string): Promise<boolean> {
  try {
    const current = await getUsageRecordById(id);
    if (!current) return false; // Or throw

    dbLogger.info('Deleting usage record', { id });

    await db.delete(usageRecords).where(eq(usageRecords.id, id));

    updateTag('usage');
    updateTag(`usage-${id}`);
    updateTag(`usage-quilt-${current.quiltId}`);
    updateTag('stats');

    return true;
  } catch (error) {
    dbLogger.error('Error deleting usage record', { id, error });
    throw error;
  }
}

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

export const getUsageRecordByIdCached = cache(getUsageRecordById);
export const getUsageHistoryCached = cache(getUsageHistory);
export const getActiveUsageRecordCached = cache(getActiveUsageRecord);
export const getAllActiveUsageRecordsCached = cache(getAllActiveUsageRecords);
export const getUsageRecordsCached = cache(getUsageRecords);
export const getUsageStatsCached = cache(getUsageStats);
