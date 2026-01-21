/**
 * Stats Repository
 *
 * Handles all database operations for statistics, analytics, and reports.
 * This repository centralizes all statistical queries to ensure consistent
 * data access patterns and proper error handling.
 *
 * Requirements: 6.1, 6.2 - Repository pattern for all database operations
 */

import { db, Tx } from '@/db';
import { quilts, usageRecords } from '@/db/schema';
import { BaseRepositoryImpl } from './base.repository';
import { eq, sql, desc, count, sum, avg, and, isNull } from 'drizzle-orm';

// Types for dashboard statistics
export interface StatusCounts {
  inUse: number;
  storage: number;
  maintenance: number;
  total: number;
}

export interface SeasonalCounts {
  WINTER: number;
  SPRING_AUTUMN: number;
  SUMMER: number;
}

export interface InUseQuilt {
  id: string;
  name: string;
  itemNumber: number;
  season: string;
  fillMaterial: string;
  weightGrams: number;
  location: string;
}

export interface HistoricalUsage {
  id: string;
  quiltId: string;
  quiltName: string;
  itemNumber: number;
  season: string;
  startDate: Date;
  endDate: Date | null;
  year: number;
}

export interface DashboardStats {
  statusCounts: StatusCounts;
  seasonalCounts: SeasonalCounts;
  inUseQuilts: InUseQuilt[];
  historicalUsage: HistoricalUsage[];
}

// Types for analytics
export interface UsageStats {
  totalPeriods: number;
  totalDays: number;
  avgDays: number;
}

export interface MostUsedQuilt {
  quiltId: string;
  name: string;
  usageCount: number;
  totalDays: number;
  averageDays: number;
}

export interface UsageByPeriod {
  period: string;
  count: number;
}

export interface AnalyticsData {
  overview: {
    totalQuilts: number;
    totalUsagePeriods: number;
    totalUsageDays: number;
    averageUsageDays: number;
    currentlyInUse: number;
  };
  statusDistribution: StatusCounts;
  seasonDistribution: SeasonalCounts;
  usageBySeason: SeasonalCounts;
  mostUsedQuilts: MostUsedQuilt[];
  usageByYear: UsageByPeriod[];
  usageByMonth: UsageByPeriod[];
}

// Types for reports
export interface QuiltReportItem {
  itemNumber: number;
  name: string;
  season: string;
  dimensions: string;
  weight: string;
  material: string;
  color: string;
  brand: string | null;
  location: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryReport {
  summary: {
    totalQuilts: number;
    byStatus: { inUse: number; storage: number; maintenance: number };
    bySeason: { winter: number; springAutumn: number; summer: number };
  };
  quilts: QuiltReportItem[];
}

export interface UsageReportItem {
  quiltName: string;
  itemNumber: number;
  season: string;
  startDate: Date;
  endDate: Date | null;
  durationDays: number | null;
  usageType: string;
  notes: string | null;
}

export interface CurrentUsageItem {
  quiltName: string;
  itemNumber: number;
  season: string;
  startedAt: Date;
  usageType: string;
  notes: string | null;
  daysInUse: number;
}

export interface UsageReport {
  summary: {
    totalUsagePeriods: number;
    currentlyInUse: number;
    totalUsageDays: number;
    averageUsageDays: number;
  };
  usagePeriods: UsageReportItem[];
  currentUsage: CurrentUsageItem[];
}

export interface StatusReportItem {
  itemNumber: number;
  name: string;
  status: string;
  season: string;
  location: string;
  lastUpdated: Date;
  usageStarted: Date | null;
  daysInCurrentStatus: number | null;
}

export interface StatusReport {
  summary: { inUse: number; storage: number; maintenance: number };
  quilts: StatusReportItem[];
}

/**
 * Stats Repository - handles all statistical database queries
 */
export class StatsRepository extends BaseRepositoryImpl<never, never> {
  protected tableName = 'quilts';

  protected rowToModel(_row: never): never {
    throw new Error('Not implemented - StatsRepository uses custom queries');
  }

  protected modelToRow(_model: never): never {
    throw new Error('Not implemented - StatsRepository uses custom queries');
  }

  /**
   * Get status counts for quilts
   */
  async getStatusCounts(tx?: Tx): Promise<StatusCounts> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const result = await d.select({
          currentStatus: quilts.currentStatus,
          count: count()
      }).from(quilts)
      .groupBy(quilts.currentStatus);

      const counts: StatusCounts = { inUse: 0, storage: 0, maintenance: 0, total: 0 };
      result.forEach(row => {
        if (row.currentStatus === 'IN_USE') counts.inUse = row.count;
        else if (row.currentStatus === 'STORAGE') counts.storage = row.count;
        else if (row.currentStatus === 'MAINTENANCE') counts.maintenance = row.count;
        counts.total += row.count;
      });

      return counts;
    }, 'getStatusCounts');
  }

  /**
   * Get seasonal distribution counts
   */
  async getSeasonalCounts(tx?: Tx): Promise<SeasonalCounts> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const result = await d.select({
          season: quilts.season,
          count: count()
      }).from(quilts)
      .groupBy(quilts.season);

      const counts: SeasonalCounts = { WINTER: 0, SPRING_AUTUMN: 0, SUMMER: 0 };
      result.forEach(row => {
        if (row.season in counts) {
          counts[row.season as keyof SeasonalCounts] = row.count;
        }
      });

      return counts;
    }, 'getSeasonalCounts');
  }

  /**
   * Get quilts currently in use with their details
   */
  async getInUseQuilts(tx?: Tx): Promise<InUseQuilt[]> {
    return this.executeQuery(async () => {
        const d = tx || db;
        const result = await d.select({
          id: quilts.id,
          name: quilts.name,
          itemNumber: quilts.itemNumber,
          season: quilts.season,
          fillMaterial: quilts.fillMaterial,
          weightGrams: quilts.weightGrams,
          location: quilts.location
        }).from(quilts).where(eq(quilts.currentStatus, 'IN_USE'));

      return result.map(q => ({
        id: q.id,
        name: q.name,
        itemNumber: q.itemNumber,
        season: q.season,
        fillMaterial: q.fillMaterial,
        weightGrams: q.weightGrams,
        location: q.location,
      }));
    }, 'getInUseQuilts');
  }

  /**
   * Get historical usage data for this day in previous years
   */
  async getHistoricalUsage(currentMonth: number, currentDay: number, tx?: Tx): Promise<HistoricalUsage[]> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        // Complex SQL logic for historical date matching.
        // It's cleaner to keep using raw SQL for complex date logic or replicate in Drizzle SQL operator.
        // Let's use d.execute(sql`...`) but map result manually.
        const query = sql`
           SELECT 
             ur.id,
             ur.quilt_id,
             ur.start_date,
             ur.end_date,
             q.name as quilt_name,
             q.item_number,
             q.season,
             EXTRACT(YEAR FROM ur.start_date) as year
           FROM usage_records ur
           JOIN quilts q ON ur.quilt_id = q.id
           WHERE 
             EXTRACT(YEAR FROM ur.start_date) < EXTRACT(YEAR FROM CURRENT_DATE)
             AND (
               CASE 
                 WHEN (EXTRACT(MONTH FROM ur.start_date) * 100 + EXTRACT(DAY FROM ur.start_date)) <= (EXTRACT(MONTH FROM ur.end_date) * 100 + EXTRACT(DAY FROM ur.end_date)) THEN
                   (${currentMonth} * 100 + ${currentDay}) >= (EXTRACT(MONTH FROM ur.start_date) * 100 + EXTRACT(DAY FROM ur.start_date))
                   AND (${currentMonth} * 100 + ${currentDay}) <= (EXTRACT(MONTH FROM ur.end_date) * 100 + EXTRACT(DAY FROM ur.end_date))
                 WHEN (EXTRACT(MONTH FROM ur.start_date) * 100 + EXTRACT(DAY FROM ur.start_date)) > (EXTRACT(MONTH FROM ur.end_date) * 100 + EXTRACT(DAY FROM ur.end_date)) THEN
                   (${currentMonth} * 100 + ${currentDay}) >= (EXTRACT(MONTH FROM ur.start_date) * 100 + EXTRACT(DAY FROM ur.start_date))
                   OR (${currentMonth} * 100 + ${currentDay}) <= (EXTRACT(MONTH FROM ur.end_date) * 100 + EXTRACT(DAY FROM ur.end_date))
                 ELSE 
                   (${currentMonth} * 100 + ${currentDay}) >= (EXTRACT(MONTH FROM ur.start_date) * 100 + EXTRACT(DAY FROM ur.start_date))
               END
             )
           ORDER BY ur.start_date DESC
           LIMIT 20
        `;
        
        const result = await d.execute(query);
        // Neon/Drizzle result format: result.rows is array of objects
        
        // Note: Drizzle's `execute` returns `QueryResult`.
        // If using Neon HTTP, it returns `QueryResultHKT`.
        // Let's assume standard PG result structure or just rows.
        // Actually, drizzle `execute` with template literal usually returns rows directly or standard object.
        // But types might be loose.
        
        return (result.rows as any[]).map(row => ({
          id: row.id,
          quiltId: row.quilt_id,
          quiltName: row.quilt_name,
          itemNumber: row.item_number,
          season: row.season,
          startDate: new Date(row.start_date),
          endDate: row.end_date ? new Date(row.end_date) : null,
          year: parseInt(row.year),
        }));
      },
      'getHistoricalUsage',
      { currentMonth, currentDay }
    );
  }

  /**
   * Get complete dashboard statistics
   */
  async getDashboardStats(tx?: Tx): Promise<DashboardStats> {
    return this.executeQuery(async () => {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      const [statusCounts, seasonalCounts, inUseQuilts] = await Promise.all([
        this.getStatusCounts(tx),
        this.getSeasonalCounts(tx),
        this.getInUseQuilts(tx),
      ]);

      let historicalUsage: HistoricalUsage[] = [];
      try {
        historicalUsage = await this.getHistoricalUsage(currentMonth, currentDay, tx);
      } catch {
        // Continue without historical data if query fails
      }

      return {
        statusCounts,
        seasonalCounts,
        inUseQuilts,
        historicalUsage,
      };
    }, 'getDashboardStats');
  }

  /**
   * Get usage statistics (total periods, total days, average days)
   */
  async getUsageStats(tx?: Tx): Promise<UsageStats> {
    return this.executeQuery(async () => {
      const d = tx || db;
      
      const result = await d.select({
          totalPeriods: count(),
          totalDays: sql<number>`
            COALESCE(SUM(
              CASE
                WHEN ${usageRecords.endDate} IS NOT NULL
                THEN EXTRACT(DAY FROM (${usageRecords.endDate}::timestamp - ${usageRecords.startDate}::timestamp))
                ELSE 0
              END
            ), 0)::int
          `,
          avgDays: sql<number>`
            COALESCE(AVG(
              CASE
                WHEN ${usageRecords.endDate} IS NOT NULL
                THEN EXTRACT(DAY FROM (${usageRecords.endDate}::timestamp - ${usageRecords.startDate}::timestamp))
                ELSE NULL
              END
            ), 0)::int
          `
      }).from(usageRecords);

      return {
        totalPeriods: result[0]?.totalPeriods || 0,
        totalDays: result[0]?.totalDays || 0,
        avgDays: result[0]?.avgDays || 0,
      };
    }, 'getUsageStats');
  }

  /**
   * Get usage counts by season
   */
  async getUsageBySeason(tx?: Tx): Promise<SeasonalCounts> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const result = await d.select({
          season: quilts.season,
          count: count()
      }).from(usageRecords)
        .leftJoin(quilts, eq(usageRecords.quiltId, quilts.id))
        .groupBy(quilts.season);

      const counts: SeasonalCounts = { WINTER: 0, SPRING_AUTUMN: 0, SUMMER: 0 };
      result.forEach(row => {
        if (row.season && row.season in counts) {
          counts[row.season as keyof SeasonalCounts] = row.count;
        }
      });

      return counts;
    }, 'getUsageBySeason');
  }

  /**
   * Get most used quilts
   */
  async getMostUsedQuilts(limit: number = 5, tx?: Tx): Promise<MostUsedQuilt[]> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        
        const result = await d.select({
            quiltId: usageRecords.quiltId,
            name: quilts.name,
            usageCount: count(),
            totalDays: sql<number>`
                COALESCE(SUM(
                  CASE
                    WHEN ${usageRecords.endDate} IS NOT NULL
                    THEN EXTRACT(DAY FROM (${usageRecords.endDate}::timestamp - ${usageRecords.startDate}::timestamp))
                    ELSE 0
                  END
                ), 0)::int
            `
        }).from(usageRecords)
          .leftJoin(quilts, eq(usageRecords.quiltId, quilts.id))
          .groupBy(usageRecords.quiltId, quilts.name)
          .orderBy(desc(count()))
          .limit(limit);

        return result.map(row => ({
          quiltId: row.quiltId,
          name: row.name || 'Unknown',
          usageCount: row.usageCount,
          totalDays: row.totalDays,
          averageDays: row.usageCount > 0 ? Math.round(row.totalDays / row.usageCount) : 0,
        }));
      },
      'getMostUsedQuilts',
      { limit }
    );
  }

  /**
   * Get usage by year
   */
  async getUsageByYear(tx?: Tx): Promise<UsageByPeriod[]> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const result = await d.select({
          year: sql<number>`EXTRACT(YEAR FROM ${usageRecords.startDate})::int`,
          count: count()
      }).from(usageRecords)
      .groupBy(sql`EXTRACT(YEAR FROM ${usageRecords.startDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${usageRecords.startDate})`);

      return result.map(row => ({
        period: String(row.year),
        count: row.count,
      }));
    }, 'getUsageByYear');
  }

  /**
   * Get usage by month (last 12 months)
   */
  async getUsageByMonth(tx?: Tx): Promise<UsageByPeriod[]> {
    return this.executeQuery(async () => {
      const d = tx || db;
      
      const result = await d.select({
          month: sql<string>`TO_CHAR(${usageRecords.startDate}, 'YYYY-MM')`,
          count: count()
      }).from(usageRecords)
      .where(sql`${usageRecords.startDate} >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')`)
      .groupBy(sql`TO_CHAR(${usageRecords.startDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${usageRecords.startDate}, 'YYYY-MM')`);

      // Build complete 12-month map with zeros for missing months
      const usageByMonthMap: { [key: string]: number } = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        usageByMonthMap[key] = 0;
      }
      result.forEach(row => {
        if (row.month in usageByMonthMap) {
          usageByMonthMap[row.month] = row.count;
        }
      });

      return Object.entries(usageByMonthMap).map(([month, count]) => ({
        period: month,
        count,
      }));
    }, 'getUsageByMonth');
  }

  /**
   * Get current usage count (active usage records)
   */
  async getCurrentUsageCount(tx?: Tx): Promise<number> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const result = await d.select({ count: count() })
          .from(usageRecords)
          .where(isNull(usageRecords.endDate));

      return result[0]?.count || 0;
    }, 'getCurrentUsageCount');
  }

  /**
   * Get complete analytics data
   */
  async getAnalyticsData(tx?: Tx): Promise<AnalyticsData> {
    return this.executeQuery(async () => {
      const [
        statusCounts,
        seasonalCounts,
        usageStats,
        usageBySeason,
        mostUsedQuilts,
        usageByYear,
        usageByMonth,
        currentUsageCount,
      ] = await Promise.all([
        this.getStatusCounts(tx),
        this.getSeasonalCounts(tx),
        this.getUsageStats(tx),
        this.getUsageBySeason(tx),
        this.getMostUsedQuilts(5, tx),
        this.getUsageByYear(tx),
        this.getUsageByMonth(tx),
        this.getCurrentUsageCount(tx),
      ]);

      return {
        overview: {
          totalQuilts: statusCounts.total,
          totalUsagePeriods: usageStats.totalPeriods,
          totalUsageDays: usageStats.totalDays,
          averageUsageDays: usageStats.avgDays,
          currentlyInUse: currentUsageCount,
        },
        statusDistribution: statusCounts,
        seasonDistribution: seasonalCounts,
        usageBySeason,
        mostUsedQuilts,
        usageByYear,
        usageByMonth,
      };
    }, 'getAnalyticsData');
  }

  /**
   * Get inventory report data
   */
  async getInventoryReport(tx?: Tx): Promise<InventoryReport> {
    return this.executeQuery(async () => {
      const d = tx || db;
      
      const [quiltsList, statusCounts, seasonCounts] = await Promise.all([
        d.select().from(quilts).orderBy(quilts.itemNumber),
        this.getStatusCounts(tx),
        this.getSeasonalCounts(tx)
      ]);

      // Parse status counts
      const byStatus = { 
          inUse: statusCounts.inUse, 
          storage: statusCounts.storage, 
          maintenance: statusCounts.maintenance 
      };

      // Parse season counts
      const bySeason = { 
          winter: seasonCounts.WINTER, 
          springAutumn: seasonCounts.SPRING_AUTUMN, 
          summer: seasonCounts.SUMMER 
      };

      return {
        summary: {
          totalQuilts: quiltsList.length,
          byStatus,
          bySeason,
        },
        quilts: quiltsList.map(q => ({
          itemNumber: q.itemNumber,
          name: q.name,
          season: q.season,
          dimensions: `${q.lengthCm}×${q.widthCm}cm`,
          weight: `${q.weightGrams}g`,
          material: q.fillMaterial,
          color: q.color,
          brand: q.brand,
          location: q.location,
          status: q.currentStatus,
          notes: q.notes,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt),
        })),
      };
    }, 'getInventoryReport');
  }

  /**
   * Get usage report data
   */
  async getUsageReport(tx?: Tx): Promise<UsageReport> {
    return this.executeQuery(async () => {
      const d = tx || db;
      
      const [records, usageStats] = await Promise.all([
        d.select({
            id: usageRecords.id,
            usageType: usageRecords.usageType,
            startDate: usageRecords.startDate,
            endDate: usageRecords.endDate,
            notes: usageRecords.notes,
            quiltName: quilts.name,
            itemNumber: quilts.itemNumber,
            season: quilts.season,
            durationDays: sql<number>`
                CASE
                  WHEN ${usageRecords.endDate} IS NOT NULL THEN 
                    EXTRACT(DAY FROM (${usageRecords.endDate}::timestamp - ${usageRecords.startDate}::timestamp))
                  ELSE NULL
                END
            `
        }).from(usageRecords)
        .leftJoin(quilts, eq(usageRecords.quiltId, quilts.id))
        .orderBy(desc(usageRecords.startDate)),
        
        this.getUsageStats(tx)
      ]);

      // Separate active and completed records
      const activeRecords = records.filter(r => !r.endDate);
      const completedRecords = records.filter(r => r.endDate);

      return {
        summary: {
          totalUsagePeriods: usageStats.totalPeriods,
          currentlyInUse: activeRecords.length,
          totalUsageDays: usageStats.totalDays,
          averageUsageDays: usageStats.avgDays,
        },
        usagePeriods: completedRecords.map(p => ({
          quiltName: p.quiltName || 'Unknown',
          itemNumber: p.itemNumber || 0,
          season: p.season || 'WINTER', // Default fallback
          startDate: new Date(p.startDate),
          endDate: p.endDate ? new Date(p.endDate) : null,
          durationDays: p.durationDays ? Math.floor(p.durationDays) : null,
          usageType: p.usageType || 'REGULAR',
          notes: p.notes,
        })),
        currentUsage: activeRecords.map(c => ({
          quiltName: c.quiltName || 'Unknown',
          itemNumber: c.itemNumber || 0,
          season: c.season || 'WINTER',
          startedAt: new Date(c.startDate),
          usageType: c.usageType || 'REGULAR',
          notes: c.notes,
          daysInUse: Math.floor(
            (new Date().getTime() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
      };
    }, 'getUsageReport');
  }

  /**
   * Get analytics report data
   */
  async getAnalyticsReport(tx?: Tx): Promise<{
    inventory: {
      total: number;
      statusDistribution: { inUse: number; storage: number; maintenance: number };
      seasonDistribution: { winter: number; springAutumn: number; summer: number };
    };
    usage: {
      totalPeriods: number;
      totalDays: number;
      averageDays: number;
      bySeason: { winter: number; springAutumn: number; summer: number };
    };
  }> {
    return this.executeQuery(async () => {
      const [statusCounts, seasonCounts, usageStats, usageBySeason] = await Promise.all([
        this.getStatusCounts(tx),
        this.getSeasonalCounts(tx),
        this.getUsageStats(tx),
        this.getUsageBySeason(tx),
      ]);

      return {
        inventory: {
          total: statusCounts.total,
          statusDistribution: {
            inUse: statusCounts.inUse,
            storage: statusCounts.storage,
            maintenance: statusCounts.maintenance,
          },
          seasonDistribution: {
            winter: seasonCounts.WINTER,
            springAutumn: seasonCounts.SPRING_AUTUMN,
            summer: seasonCounts.SUMMER,
          },
        },
        usage: {
          totalPeriods: usageStats.totalPeriods,
          totalDays: usageStats.totalDays,
          averageDays: usageStats.avgDays,
          bySeason: {
            winter: usageBySeason.WINTER,
            springAutumn: usageBySeason.SPRING_AUTUMN,
            summer: usageBySeason.SUMMER,
          },
        },
      };
    }, 'getAnalyticsReport');
  }

  /**
   * Get status report data
   */
  async getStatusReport(tx?: Tx): Promise<StatusReport> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const [quiltsList, statusCounts] = await Promise.all([
        d.select({
            itemNumber: quilts.itemNumber,
            name: quilts.name,
            currentStatus: quilts.currentStatus,
            season: quilts.season,
            location: quilts.location,
            updatedAt: quilts.updatedAt,
            usageStarted: usageRecords.startDate
        }).from(quilts)
        .leftJoin(usageRecords, and(eq(quilts.id, usageRecords.quiltId), isNull(usageRecords.endDate)))
        .orderBy(quilts.currentStatus, quilts.itemNumber),
        
        this.getStatusCounts(tx)
      ]);

      // Parse status counts
      const summary = { 
          inUse: statusCounts.inUse, 
          storage: statusCounts.storage, 
          maintenance: statusCounts.maintenance 
      };

      return {
        summary,
        quilts: quiltsList.map(q => ({
          itemNumber: q.itemNumber,
          name: q.name,
          status: q.currentStatus,
          season: q.season,
          location: q.location,
          lastUpdated: new Date(q.updatedAt),
          usageStarted: q.usageStarted ? new Date(q.usageStarted) : null,
          daysInCurrentStatus: q.usageStarted
            ? Math.floor((new Date().getTime() - new Date(q.usageStarted).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
      };
    }, 'getStatusReport');
  }
}

// Export singleton instance
export const statsRepository = new StatsRepository();
