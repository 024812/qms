/**
 * Usage Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices.
 * Replaces the class-based UsageRepository pattern.
 *
 * Architecture:
 * - Standalone async functions (not classes)
 * - 'use cache' directive for persistent caching
 * - React cache() for request-level deduplication
 * - Serializable data only (no class instances, no undefined)
 * - Cache invalidation with updateTag()
 *
 * Cache Strategy:
 * - Individual records: 2 minutes (120 seconds)
 * - Lists: 1 minute (60 seconds)
 * - Tags: 'usage-logs', 'usage-logs-{id}', 'usage-logs-quilt-{quiltId}', 'usage-logs-active'
 *
 * Requirements: 2.1-2.6, 3.1-3.6 from Next.js 16 Best Practices Migration spec
 */

import { cache } from 'react';
import {
  cacheLife,
  cacheTag,
  updateTag,
} from 'next/cache';

import { sql } from '@/lib/neon';
import { dbLogger } from '@/lib/logger';
import { type UsageRecord, type UsageRecordRow, rowToUsageRecord } from '@/lib/database/types';
import { UsageType } from '@/lib/validations/quilt';

// ============================================================================
// Types
// ============================================================================

export interface CreateUsageRecordData {
  quiltId: string;
  startDate: Date;
  endDate?: Date | null;
  usageType?: UsageType;
  notes?: string | null;
}

export interface UpdateUsageRecordData {
  startDate?: Date;
  endDate?: Date | null;
  notes?: string | null;
}

export interface UsageRecordWithQuilt {
  id: string;
  quiltId: string;
  quiltName: string;
  itemNumber: number;
  color: string;
  season: string;
  currentStatus: string;
  startedAt: Date;
  endedAt: Date | null;
  usageType: UsageType;
  notes: string | null;
  isActive: boolean;
  duration: number | null;
}

interface UsageRecordWithQuiltRow {
  id: string;
  quilt_id: string;
  start_date: string;
  end_date: string | null;
  usage_type: UsageType;
  notes: string | null;
  quilt_name: string;
  item_number: number;
  color: string;
  season: string;
  current_status: string;
  is_active: boolean;
  duration: number | null;
}

export interface UsageStats {
  totalUsages: number;
  totalDays: number;
  averageDays: number;
  lastUsedDate: Date | null;
}

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get usage record by ID
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'usage-logs', 'usage-logs-{id}'
 */
export async function getUsageRecordById(id: string): Promise<UsageRecord | null> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('usage-logs', `usage-logs-${id}`);

  try {
    const rows = (await sql`
      SELECT * FROM usage_records
      WHERE id = ${id}
    `) as UsageRecordRow[];

    return rows[0] ? rowToUsageRecord(rows[0]) : null;
  } catch (error) {
    dbLogger.error('Error fetching usage record by ID', { id, error });
    throw error;
  }
}

/**
 * Get all usage records with optional filtering
 * Returns usage records with joined quilt information
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'usage-logs', 'usage-logs-list', plus dynamic tags based on filters
 */
export async function getUsageRecords(
  filters: { quiltId?: string; limit?: number; offset?: number } = {}
): Promise<UsageRecordWithQuilt[]> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)

  const tags = ['usage-logs', 'usage-logs-list'];
  if (filters.quiltId) {
    tags.push(`usage-logs-quilt-${filters.quiltId}`);
  }
  cacheTag(...tags);

  try {
    const { quiltId, limit = 50, offset = 0 } = filters;

    let rows: UsageRecordWithQuiltRow[];

    if (!quiltId) {
      rows = (await sql`
        SELECT 
          ur.*,
          q.name as quilt_name,
          q.item_number,
          q.color,
          q.season,
          q.current_status,
          CASE 
            WHEN ur.end_date IS NULL THEN true
            ELSE false
          END as is_active,
          CASE
            WHEN ur.end_date IS NOT NULL THEN 
              EXTRACT(DAY FROM (ur.end_date::timestamp - ur.start_date::timestamp))
            ELSE NULL
          END as duration
        FROM usage_records ur
        JOIN quilts q ON ur.quilt_id = q.id
        ORDER BY ur.start_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as UsageRecordWithQuiltRow[];
    } else {
      rows = (await sql`
        SELECT 
          ur.*,
          q.name as quilt_name,
          q.item_number,
          q.color,
          q.season,
          q.current_status,
          CASE 
            WHEN ur.end_date IS NULL THEN true
            ELSE false
          END as is_active,
          CASE
            WHEN ur.end_date IS NOT NULL THEN 
              EXTRACT(DAY FROM (ur.end_date::timestamp - ur.start_date::timestamp))
            ELSE NULL
          END as duration
        FROM usage_records ur
        JOIN quilts q ON ur.quilt_id = q.id
        WHERE ur.quilt_id = ${quiltId}
        ORDER BY ur.start_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as UsageRecordWithQuiltRow[];
    }

    return rows.map(row => ({
      id: row.id,
      quiltId: row.quilt_id,
      quiltName: row.quilt_name,
      itemNumber: row.item_number,
      color: row.color,
      season: row.season,
      currentStatus: row.current_status,
      startedAt: new Date(row.start_date),
      endedAt: row.end_date ? new Date(row.end_date) : null,
      usageType: row.usage_type,
      notes: row.notes,
      isActive: row.is_active,
      duration: row.duration ? Math.floor(row.duration) : null,
    }));
  } catch (error) {
    dbLogger.error('Error fetching usage records', { filters, error });
    throw error;
  }
}

/**
 * Get usage records by quilt ID
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'usage-logs', 'usage-logs-quilt-{quiltId}'
 */
export async function getUsageRecordsByQuiltId(quiltId: string): Promise<UsageRecord[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('usage-logs', `usage-logs-quilt-${quiltId}`);

  try {
    const rows = (await sql`
      SELECT * FROM usage_records
      WHERE quilt_id = ${quiltId}
      ORDER BY start_date DESC
    `) as UsageRecordRow[];

    return rows.map(row => rowToUsageRecord(row));
  } catch (error) {
    dbLogger.error('Error fetching usage records by quilt ID', { quiltId, error });
    throw error;
  }
}

/**
 * Get the active usage record for a quilt (end_date is NULL)
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'usage-logs', 'usage-logs-active', 'usage-logs-quilt-{quiltId}'
 */
export async function getActiveUsageRecord(quiltId: string): Promise<UsageRecord | null> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('usage-logs', 'usage-logs-active', `usage-logs-quilt-${quiltId}`);

  try {
    const rows = (await sql`
      SELECT * FROM usage_records
      WHERE quilt_id = ${quiltId}
        AND end_date IS NULL
      LIMIT 1
    `) as UsageRecordRow[];

    return rows[0] ? rowToUsageRecord(rows[0]) : null;
  } catch (error) {
    dbLogger.error('Error fetching active usage record', { quiltId, error });
    throw error;
  }
}

/**
 * Get all active usage records (end_date is NULL)
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'usage-logs', 'usage-logs-active'
 */
export async function getAllActiveUsageRecords(): Promise<UsageRecord[]> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('usage-logs', 'usage-logs-active');

  try {
    const rows = (await sql`
      SELECT * FROM usage_records
      WHERE end_date IS NULL
      ORDER BY start_date DESC
    `) as UsageRecordRow[];

    return rows.map(row => rowToUsageRecord(row));
  } catch (error) {
    dbLogger.error('Error fetching all active usage records', { error });
    throw error;
  }
}

/**
 * Get usage statistics for a quilt
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'usage-logs', 'usage-logs-quilt-{quiltId}'
 */
export async function getUsageStats(quiltId: string): Promise<UsageStats> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('usage-logs', `usage-logs-quilt-${quiltId}`);

  try {
    const result = (await sql`
      SELECT
        COUNT(*) as total_usages,
        COALESCE(SUM(
          CASE
            WHEN end_date IS NOT NULL
            THEN EXTRACT(DAY FROM (end_date::timestamp - start_date::timestamp))
            ELSE 0
          END
        ), 0) as total_days,
        MAX(start_date) as last_used
      FROM usage_records
      WHERE quilt_id = ${quiltId}
    `) as [
        {
          total_usages: string;
          total_days: string;
          last_used: string | null;
        },
      ];

    const totalUsages = parseInt(result[0]?.total_usages || '0', 10);
    const totalDays = parseFloat(result[0]?.total_days || '0');
    const averageDays = totalUsages > 0 ? totalDays / totalUsages : 0;
    const lastUsedDate = result[0]?.last_used ? new Date(result[0].last_used) : null;

    return {
      totalUsages,
      totalDays,
      averageDays,
      lastUsedDate,
    };
  } catch (error) {
    dbLogger.error('Error fetching usage stats', { quiltId, error });
    throw error;
  }
}

// ============================================================================
// WRITE OPERATIONS (with cache invalidation)
// ============================================================================

/**
 * Create a new usage record (when quilt status changes to IN_USE)
 *
 * Invalidates: 'usage-logs', 'usage-logs-list', 'usage-logs-active', quilt-specific tags
 */
export async function createUsageRecord(data: CreateUsageRecordData): Promise<UsageRecord> {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    dbLogger.info('Creating usage record', { quiltId: data.quiltId });

    const rows = (await sql`
      INSERT INTO usage_records (
        id, quilt_id, start_date, end_date, usage_type, notes, created_at, updated_at
      ) VALUES (
        ${id},
        ${data.quiltId},
        ${data.startDate.toISOString()},
        ${data.endDate ? data.endDate.toISOString() : null},
        ${data.usageType || 'REGULAR'},
        ${data.notes || null},
        ${now},
        ${now}
      ) RETURNING *
    `) as UsageRecordRow[];

    const record = rowToUsageRecord(rows[0]);

    // Invalidate cache tags
    updateTag('usage-logs');
    updateTag('usage-logs-list');
    updateTag('usage-logs-active');
    updateTag(`usage-logs-quilt-${data.quiltId}`);

    dbLogger.info('Usage record created successfully', { id, quiltId: data.quiltId });
    return record;
  } catch (error) {
    dbLogger.error('Error creating usage record', { data, error });
    throw error;
  }
}

/**
 * Update a usage record
 *
 * Invalidates: specific record, list, and related tags
 */
export async function updateUsageRecord(
  id: string,
  data: UpdateUsageRecordData
): Promise<UsageRecord | null> {
  try {
    // Get current record for cache invalidation
    const current = await getUsageRecordById(id);
    if (!current) {
      dbLogger.warn('Usage record not found for update', { id });
      return null;
    }

    const now = new Date().toISOString();

    dbLogger.info('Updating usage record', { id });

    const rows = (await sql`
      UPDATE usage_records
      SET
        start_date = ${data.startDate ? data.startDate.toISOString() : sql`start_date`},
        end_date = ${data.endDate !== undefined ? (data.endDate ? data.endDate.toISOString() : null) : sql`end_date`},
        notes = ${data.notes !== undefined ? data.notes : sql`notes`},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `) as UsageRecordRow[];

    if (rows.length === 0) {
      return null;
    }

    const updated = rowToUsageRecord(rows[0]);

    // Invalidate cache tags
    updateTag('usage-logs');
    updateTag('usage-logs-list');
    updateTag(`usage-logs-${id}`);
    updateTag(`usage-logs-quilt-${updated.quiltId}`);

    // If end_date changed, invalidate active tags
    if (current.endDate !== updated.endDate) {
      updateTag('usage-logs-active');
    }

    dbLogger.info('Usage record updated successfully', { id });
    return updated;
  } catch (error) {
    dbLogger.error('Error updating usage record', { id, data, error });
    throw error;
  }
}

/**
 * End the active usage record (when quilt status changes from IN_USE)
 *
 * Invalidates: 'usage-logs', 'usage-logs-active', quilt-specific tags
 */
export async function endUsageRecord(
  quiltId: string,
  endDate: Date,
  notes?: string
): Promise<UsageRecord | null> {
  try {
    const now = new Date().toISOString();

    dbLogger.info('Ending usage record', { quiltId, endDate });

    const rows = (await sql`
      UPDATE usage_records
      SET
        end_date = ${endDate.toISOString()},
        notes = COALESCE(${notes || null}, notes),
        updated_at = ${now}
      WHERE quilt_id = ${quiltId}
        AND end_date IS NULL
      RETURNING *
    `) as UsageRecordRow[];

    if (rows.length === 0) {
      dbLogger.warn('No active usage record found to end', { quiltId });
      return null;
    }

    const record = rowToUsageRecord(rows[0]);

    // Invalidate cache tags
    updateTag('usage-logs');
    updateTag('usage-logs-list');
    updateTag('usage-logs-active');
    updateTag(`usage-logs-${record.id}`);
    updateTag(`usage-logs-quilt-${quiltId}`);

    dbLogger.info('Usage record ended successfully', { id: record.id, quiltId });
    return record;
  } catch (error) {
    dbLogger.error('Error ending usage record', { quiltId, endDate, error });
    throw error;
  }
}

/**
 * Delete a usage record
 *
 * Invalidates: all usage-related caches
 */
export async function deleteUsageRecord(id: string): Promise<boolean> {
  try {
    // Get record info for cache invalidation before deletion
    const record = await getUsageRecordById(id);

    const result = await sql`
      DELETE FROM usage_records
      WHERE id = ${id}
      RETURNING id
    `;

    const success = result.length > 0;
    if (success) {
      // Invalidate cache tags
      updateTag('usage-logs');
      updateTag('usage-logs-list');
      updateTag(`usage-logs-${id}`);
      if (record) {
        updateTag(`usage-logs-quilt-${record.quiltId}`);
        if (!record.endDate) {
          updateTag('usage-logs-active');
        }
      }

      dbLogger.info('Usage record deleted successfully', { id });
    }
    return success;
  } catch (error) {
    dbLogger.error('Error deleting usage record', { id, error });
    throw error;
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
export const getUsageRecordByIdCached = cache(getUsageRecordById);
export const getUsageRecordsCached = cache(getUsageRecords);
export const getUsageRecordsByQuiltIdCached = cache(getUsageRecordsByQuiltId);
export const getActiveUsageRecordCached = cache(getActiveUsageRecord);
export const getAllActiveUsageRecordsCached = cache(getAllActiveUsageRecords);
export const getUsageStatsCached = cache(getUsageStats);
