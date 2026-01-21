/**
 * Usage Repository
 *
 * Handles all database operations for usage records with type safety and proper error handling.
 */

import { db, Tx } from '@/db';
import { usageRecords, quilts } from '@/db/schema';
import { dbLogger } from '@/lib/logger';
import { BaseRepositoryImpl } from './base.repository';
import {
  UsageRecord,
  UsageRecordRow,
  rowToUsageRecord,
  usageRecordToRow,
} from '@/lib/database/types';
import { UsageType } from '@/lib/validations/quilt';
import { eq, and, desc, isNull, sql, SQL, count, sum, max } from 'drizzle-orm';

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

export class UsageRepository extends BaseRepositoryImpl<UsageRecordRow, UsageRecord> {
  protected tableName = 'usage_records';

  protected rowToModel(row: UsageRecordRow): UsageRecord {
    return rowToUsageRecord(row);
  }

  protected modelToRow(model: Partial<UsageRecord>): Partial<UsageRecordRow> {
    return usageRecordToRow(model);
  }

  /**
   * Find a usage record by ID
   */
  async findById(id: string, tx?: Tx): Promise<UsageRecord | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const rows = await d.select().from(usageRecords).where(eq(usageRecords.id, id)).limit(1);
        return rows[0] ? this.rowToModel(rows[0] as unknown as UsageRecordRow) : null;
      },
      'findById',
      { id }
    );
  }

  /**
   * Find all usage records with optional filtering
   * Returns usage records with joined quilt information
   */
  async findAll(
    filters: { quiltId?: string; limit?: number; offset?: number } = {},
    tx?: Tx
  ): Promise<any[]> {
    return this.executeQuery(
      async () => {
        const { quiltId, limit = 50, offset = 0 } = filters;
        const d = tx || db;

        let query = d.select({
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
        }).from(usageRecords)
          .leftJoin(quilts, eq(usageRecords.quiltId, quilts.id))
          .orderBy(desc(usageRecords.startDate))
          .limit(limit)
          .offset(offset);

        if (quiltId) {
            query.where(eq(usageRecords.quiltId, quiltId));
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
      },
      'findAll',
      { filters }
    );
  }

  /**
   * Find usage records by quilt ID
   */
  async findByQuiltId(quiltId: string, tx?: Tx): Promise<UsageRecord[]> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const rows = await d.select()
            .from(usageRecords)
            .where(eq(usageRecords.quiltId, quiltId))
            .orderBy(desc(usageRecords.startDate));
        return rows.map(row => this.rowToModel(row as unknown as UsageRecordRow));
      },
      'findByQuiltId',
      { quiltId }
    );
  }

  /**
   * Get the active usage record for a quilt (end_date is NULL)
   */
  async getActiveUsageRecord(quiltId: string, tx?: Tx): Promise<UsageRecord | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const rows = await d.select()
            .from(usageRecords)
            .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)))
            .limit(1);
        return rows[0] ? this.rowToModel(rows[0] as unknown as UsageRecordRow) : null;
      },
      'getActiveUsageRecord',
      { quiltId }
    );
  }

  /**
   * Create a new usage record (when quilt status changes to IN_USE)
   */
  async createUsageRecord(data: CreateUsageRecordData, tx?: Tx): Promise<UsageRecord> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const now = new Date(); // Drizzle handles Date object
        
        dbLogger.info('Creating usage record', { quiltId: data.quiltId });

        // id is uuid defaultRandom in schema? 
        // Schema: id: uuid("id").primaryKey().defaultRandom().notNull(),
        // so we don't need to pass ID.
        
        const rows = await d.insert(usageRecords).values({
            quiltId: data.quiltId,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            usageType: data.usageType || 'REGULAR',
            notes: data.notes || null,
            createdAt: now,
            updatedAt: now
        }).returning();

        dbLogger.info('Usage record created successfully', { id: rows[0].id, quiltId: data.quiltId });
        return this.rowToModel(rows[0] as unknown as UsageRecordRow);
      },
      'createUsageRecord',
      { data }
    );
  }

  /**
   * End the active usage record (when quilt status changes from IN_USE)
   */
  async endUsageRecord(
    quiltId: string,
    endDate: Date,
    notes?: string,
    tx?: Tx
  ): Promise<UsageRecord | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const now = new Date();

        dbLogger.info('Ending usage record', { quiltId, endDate });

        const rows = await d.update(usageRecords)
            .set({
                endDate: endDate,
                notes: notes ? notes : undefined, // Only update notes if provided? Original logic: COALESCE(val, notes) which means update if val provided.
                // Wait, original logic: notes = COALESCE(${notes || null}, notes). 
                // If notes arg is null, it keeps existing notes.
                // In Drizzle, if we don't set 'notes', it keeps existing.
                ...(notes ? { notes } : {}),
                updatedAt: now
            })
            .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)))
            .returning();

        if (rows.length === 0) {
          dbLogger.warn('No active usage record found to end', { quiltId });
          return null;
        }

        dbLogger.info('Usage record ended successfully', { id: rows[0].id, quiltId });
        return this.rowToModel(rows[0] as unknown as UsageRecordRow);
      },
      'endUsageRecord',
      { quiltId, endDate }
    );
  }

  /**
   * Update a usage record
   */
  async update(id: string, data: UpdateUsageRecordData, tx?: Tx): Promise<UsageRecord | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const now = new Date();

        dbLogger.info('Updating usage record', { id });

        const updateValues: any = { updatedAt: now };
        if (data.startDate !== undefined) updateValues.startDate = data.startDate;
        if (data.endDate !== undefined) updateValues.endDate = data.endDate;
        if (data.notes !== undefined) updateValues.notes = data.notes;

        const rows = await d.update(usageRecords)
            .set(updateValues)
            .where(eq(usageRecords.id, id))
            .returning();

        if (rows.length === 0) {
          return null;
        }

        dbLogger.info('Usage record updated successfully', { id });
        return this.rowToModel(rows[0] as unknown as UsageRecordRow);
      },
      'update',
      { id, data }
    );
  }

  /**
   * Get all active usage records (end_date is NULL)
   */
  async getAllActive(tx?: Tx): Promise<UsageRecord[]> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const rows = await d.select()
          .from(usageRecords)
          .where(isNull(usageRecords.endDate))
          .orderBy(desc(usageRecords.startDate));
      return rows.map(row => this.rowToModel(row as unknown as UsageRecordRow));
    }, 'getAllActive');
  }

  /**
   * Get usage statistics for a quilt
   */
  async getUsageStats(quiltId: string, tx?: Tx): Promise<{
    totalUsages: number;
    totalDays: number;
    averageDays: number;
    lastUsedDate: Date | null;
  }> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        
        // Drizzle aggregation
        // total days = sum(EXTRACT(DAY FROM (end_date - start_date)))
        // We can use sql template for expression
        
        const result = await d.select({
            totalUsages: count(),
            totalDays: sql<number>`
                COALESCE(SUM(
                  CASE
                    WHEN ${usageRecords.endDate} IS NOT NULL
                    THEN EXTRACT(DAY FROM (${usageRecords.endDate}::timestamp - ${usageRecords.startDate}::timestamp))
                    ELSE 0
                  END
                ), 0)
            `.mapWith(Number),
            lastUsed: max(usageRecords.startDate)
        })
        .from(usageRecords)
        .where(eq(usageRecords.quiltId, quiltId));

        const stats = result[0];
        const totalUsages = stats.totalUsages || 0;
        const totalDays = stats.totalDays || 0;
        const averageDays = totalUsages > 0 ? totalDays / totalUsages : 0;
        const lastUsedDate = stats.lastUsed ? new Date(stats.lastUsed) : null;

        return {
          totalUsages,
          totalDays,
          averageDays,
          lastUsedDate,
        };
      },
      'getUsageStats',
      { quiltId }
    );
  }

  /**
   * Delete a usage record
   */
  async delete(id: string, tx?: Tx): Promise<boolean> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const result = await d.delete(usageRecords)
            .where(eq(usageRecords.id, id))
            .returning({ id: usageRecords.id });

        const success = result.length > 0;
        if (success) {
          dbLogger.info('Usage record deleted successfully', { id });
        }
        return success;
      },
      'delete',
      { id }
    );
  }
}

// Export singleton instance
export const usageRepository = new UsageRepository();
