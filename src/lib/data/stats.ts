/**
 * Stats Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices.
 * Replaces the class-based StatsRepository pattern.
 *
 * Architecture:
 * - Standalone async functions (not classes)
 * - 'use cache' directive for persistent caching
 * - React cache() for request-level deduplication
 * - Serializable data only (no class instances, no undefined)
 * - Cache invalidation with updateTag()
 *
 * Cache Strategy:
 * - Dashboard stats: 1 minute (60 seconds)
 * - Analytics data: 2 minutes (120 seconds)
 * - Reports: 5 minutes
 * - Tags: 'stats', 'stats-dashboard', 'stats-analytics', 'stats-reports'
 *
 * Requirements: 2.1-2.6, 3.1-3.6 from Next.js 16 Best Practices Migration spec
 */

import { cache } from 'react';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { sql } from '@/lib/neon';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get status counts for quilts
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-dashboard'
 */
export async function getStatusCounts(): Promise<StatusCounts> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-dashboard');

  const result = (await sql`
    SELECT 
      current_status,
      COUNT(*)::int as count
    FROM quilts
    GROUP BY current_status
  `) as { current_status: string; count: number }[];

  const counts: StatusCounts = { inUse: 0, storage: 0, maintenance: 0, total: 0 };
  result.forEach(row => {
    if (row.current_status === 'IN_USE') counts.inUse = row.count;
    else if (row.current_status === 'STORAGE') counts.storage = row.count;
    else if (row.current_status === 'MAINTENANCE') counts.maintenance = row.count;
    counts.total += row.count;
  });

  return counts;
}

/**
 * Get seasonal distribution counts
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-dashboard'
 */
export async function getSeasonalCounts(): Promise<SeasonalCounts> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-dashboard');

  const result = (await sql`
    SELECT 
      season,
      COUNT(*)::int as count
    FROM quilts
    GROUP BY season
  `) as { season: string; count: number }[];

  const counts: SeasonalCounts = { WINTER: 0, SPRING_AUTUMN: 0, SUMMER: 0 };
  result.forEach(row => {
    if (row.season in counts) {
      counts[row.season as keyof SeasonalCounts] = row.count;
    }
  });

  return counts;
}

/**
 * Get quilts currently in use with their details
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-dashboard'
 */
export async function getInUseQuilts(): Promise<InUseQuilt[]> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-dashboard');

  const result = (await sql`
    SELECT 
      id, name, item_number, season, 
      fill_material, weight_grams, location
    FROM quilts
    WHERE current_status = 'IN_USE'
  `) as Array<{
    id: string;
    name: string;
    item_number: number;
    season: string;
    fill_material: string;
    weight_grams: number;
    location: string;
  }>;

  return result.map(q => ({
    id: q.id,
    name: q.name,
    itemNumber: q.item_number,
    season: q.season,
    fillMaterial: q.fill_material,
    weightGrams: q.weight_grams,
    location: q.location,
  }));
}

/**
 * Get historical usage data for this day in previous years
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-dashboard'
 */
export async function getHistoricalUsage(
  currentMonth: number,
  currentDay: number
): Promise<HistoricalUsage[]> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-dashboard');

  const result = (await sql`
    SELECT 
      up.id,
      up.quilt_id,
      up.start_date,
      up.end_date,
      q.name as quilt_name,
      q.item_number,
      q.season,
      EXTRACT(YEAR FROM up.start_date) as year
    FROM usage_records up
    JOIN quilts q ON up.quilt_id = q.id
    WHERE 
      EXTRACT(YEAR FROM up.start_date) < EXTRACT(YEAR FROM CURRENT_DATE)
      AND (
        CASE 
          WHEN (EXTRACT(MONTH FROM up.start_date) * 100 + EXTRACT(DAY FROM up.start_date)) <= (EXTRACT(MONTH FROM up.end_date) * 100 + EXTRACT(DAY FROM up.end_date)) THEN
            (${currentMonth} * 100 + ${currentDay}) >= (EXTRACT(MONTH FROM up.start_date) * 100 + EXTRACT(DAY FROM up.start_date))
            AND (${currentMonth} * 100 + ${currentDay}) <= (EXTRACT(MONTH FROM up.end_date) * 100 + EXTRACT(DAY FROM up.end_date))
          WHEN (EXTRACT(MONTH FROM up.start_date) * 100 + EXTRACT(DAY FROM up.start_date)) > (EXTRACT(MONTH FROM up.end_date) * 100 + EXTRACT(DAY FROM up.end_date)) THEN
            (${currentMonth} * 100 + ${currentDay}) >= (EXTRACT(MONTH FROM up.start_date) * 100 + EXTRACT(DAY FROM up.start_date))
            OR (${currentMonth} * 100 + ${currentDay}) <= (EXTRACT(MONTH FROM up.end_date) * 100 + EXTRACT(DAY FROM up.end_date))
          ELSE 
            (${currentMonth} * 100 + ${currentDay}) >= (EXTRACT(MONTH FROM up.start_date) * 100 + EXTRACT(DAY FROM up.start_date))
        END
      )
    ORDER BY up.start_date DESC
    LIMIT 20
  `) as Array<{
    id: string;
    quilt_id: string;
    start_date: string;
    end_date: string | null;
    quilt_name: string;
    item_number: number;
    season: string;
    year: string;
  }>;

  return result.map(row => ({
    id: row.id,
    quiltId: row.quilt_id,
    quiltName: row.quilt_name,
    itemNumber: row.item_number,
    season: row.season,
    startDate: new Date(row.start_date),
    endDate: row.end_date ? new Date(row.end_date) : null,
    year: parseInt(row.year),
  }));
}

/**
 * Get complete dashboard statistics
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-dashboard'
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-dashboard');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const [statusCounts, seasonalCounts, inUseQuilts] = await Promise.all([
    getStatusCounts(),
    getSeasonalCounts(),
    getInUseQuilts(),
  ]);

  let historicalUsage: HistoricalUsage[] = [];
  try {
    historicalUsage = await getHistoricalUsage(currentMonth, currentDay);
  } catch {
    // Continue without historical data if query fails
  }

  return {
    statusCounts,
    seasonalCounts,
    inUseQuilts,
    historicalUsage,
  };
}

/**
 * Get usage statistics (total periods, total days, average days)
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getUsageStats(): Promise<UsageStats> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('stats', 'stats-analytics');

  const result = (await sql`
    SELECT 
      COUNT(*)::int as total_periods,
      COALESCE(SUM(
        CASE
          WHEN end_date IS NOT NULL
          THEN EXTRACT(DAY FROM (end_date::timestamp - start_date::timestamp))
          ELSE 0
        END
      ), 0)::int as total_days,
      COALESCE(AVG(
        CASE
          WHEN end_date IS NOT NULL
          THEN EXTRACT(DAY FROM (end_date::timestamp - start_date::timestamp))
          ELSE NULL
        END
      ), 0)::int as avg_days
    FROM usage_records
  `) as [{ total_periods: number; total_days: number; avg_days: number }];

  return {
    totalPeriods: result[0]?.total_periods || 0,
    totalDays: result[0]?.total_days || 0,
    avgDays: result[0]?.avg_days || 0,
  };
}

/**
 * Get usage counts by season
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getUsageBySeason(): Promise<SeasonalCounts> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('stats', 'stats-analytics');

  const result = (await sql`
    SELECT 
      q.season,
      COUNT(*)::int as count
    FROM usage_records up
    JOIN quilts q ON up.quilt_id = q.id
    GROUP BY q.season
  `) as { season: string; count: number }[];

  const counts: SeasonalCounts = { WINTER: 0, SPRING_AUTUMN: 0, SUMMER: 0 };
  result.forEach(row => {
    if (row.season in counts) {
      counts[row.season as keyof SeasonalCounts] = row.count;
    }
  });

  return counts;
}

/**
 * Get most used quilts
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getMostUsedQuilts(limit: number = 5): Promise<MostUsedQuilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('stats', 'stats-analytics');

  const result = (await sql`
    SELECT 
      up.quilt_id,
      q.name,
      COUNT(*)::int as usage_count,
      COALESCE(SUM(
        CASE
          WHEN up.end_date IS NOT NULL
          THEN EXTRACT(DAY FROM (up.end_date::timestamp - up.start_date::timestamp))
          ELSE 0
        END
      ), 0)::int as total_days
    FROM usage_records up
    JOIN quilts q ON up.quilt_id = q.id
    GROUP BY up.quilt_id, q.name
    ORDER BY usage_count DESC
    LIMIT ${limit}
  `) as Array<{
    quilt_id: string;
    name: string;
    usage_count: number;
    total_days: number;
  }>;

  return result.map(row => ({
    quiltId: row.quilt_id,
    name: row.name,
    usageCount: row.usage_count,
    totalDays: row.total_days,
    averageDays: row.usage_count > 0 ? Math.round(row.total_days / row.usage_count) : 0,
  }));
}

/**
 * Get usage by year
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getUsageByYear(): Promise<UsageByPeriod[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('stats', 'stats-analytics');

  const result = (await sql`
    SELECT 
      EXTRACT(YEAR FROM start_date)::int as year,
      COUNT(*)::int as count
    FROM usage_records
    GROUP BY EXTRACT(YEAR FROM start_date)
    ORDER BY year
  `) as { year: number; count: number }[];

  return result.map(row => ({
    period: String(row.year),
    count: row.count,
  }));
}

/**
 * Get usage by month (last 12 months)
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getUsageByMonth(): Promise<UsageByPeriod[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('stats', 'stats-analytics');

  const result = (await sql`
    SELECT 
      TO_CHAR(start_date, 'YYYY-MM') as month,
      COUNT(*)::int as count
    FROM usage_records
    WHERE start_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
    GROUP BY TO_CHAR(start_date, 'YYYY-MM')
    ORDER BY month
  `) as { month: string; count: number }[];

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
}

/**
 * Get current usage count (active usage records)
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getCurrentUsageCount(): Promise<number> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-analytics');

  const result = (await sql`
    SELECT COUNT(*)::int as count 
    FROM usage_records 
    WHERE end_date IS NULL
  `) as [{ count: number }];

  return result[0]?.count || 0;
}

/**
 * Get complete analytics data
 *
 * Cache: 2 minutes (120 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('stats', 'stats-analytics');

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
    getStatusCounts(),
    getSeasonalCounts(),
    getUsageStats(),
    getUsageBySeason(),
    getMostUsedQuilts(),
    getUsageByYear(),
    getUsageByMonth(),
    getCurrentUsageCount(),
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
}

/**
 * Get simple usage stats (total and active counts)
 *
 * Cache: 1 minute (60 seconds)
 * Tags: 'stats', 'stats-analytics'
 */
export async function getSimpleUsageStats(): Promise<{
  total: number;
  active: number;
  completed: number;
}> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('stats', 'stats-analytics');

  const [totalResult, activeResult] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM usage_records`,
    sql`SELECT COUNT(*)::int as count FROM usage_records WHERE end_date IS NULL`,
  ]);

  const total = (totalResult as Array<{ count: number }>)[0]?.count || 0;
  const active = (activeResult as Array<{ count: number }>)[0]?.count || 0;

  return {
    total,
    active,
    completed: total - active,
  };
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
export const getStatusCountsCached = cache(getStatusCounts);
export const getSeasonalCountsCached = cache(getSeasonalCounts);
export const getInUseQuiltsCached = cache(getInUseQuilts);
export const getHistoricalUsageCached = cache(getHistoricalUsage);
export const getDashboardStatsCached = cache(getDashboardStats);
export const getUsageStatsCached = cache(getUsageStats);
export const getUsageBySeasonCached = cache(getUsageBySeason);
export const getMostUsedQuiltsCached = cache(getMostUsedQuilts);
export const getUsageByYearCached = cache(getUsageByYear);
export const getUsageByMonthCached = cache(getUsageByMonth);
export const getCurrentUsageCountCached = cache(getCurrentUsageCount);
export const getAnalyticsDataCached = cache(getAnalyticsData);
export const getSimpleUsageStatsCached = cache(getSimpleUsageStats);
