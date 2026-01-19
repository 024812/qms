/**
 * Statistics Analysis Service
 * 
 * Provides generic statistical calculation functions that support custom metrics.
 * This service can be used by any module to calculate statistics on their data.
 * 
 * Requirements: 6.2 - Generic statistics analysis engine with custom metrics support
 */

import { Item } from '@/db/schema';

/**
 * Metric definition interface
 */
export interface MetricDefinition<T = any> {
  /** Unique metric identifier */
  key: string;
  /** Display label */
  label: string;
  /** Calculation function */
  calculate: (items: T[]) => number | string;
  /** Optional formatter for display */
  format?: (value: number | string) => string;
  /** Optional description */
  description?: string;
}

/**
 * Statistics result interface
 */
export interface StatisticsResult {
  [key: string]: {
    label: string;
    value: number | string;
    formatted?: string;
    description?: string;
  };
}

/**
 * Calculate statistics based on metric definitions
 * 
 * @param items - Array of items to analyze
 * @param metrics - Array of metric definitions
 * @returns Statistics results
 */
export function calculateStatistics<T = any>(
  items: T[],
  metrics: MetricDefinition<T>[]
): StatisticsResult {
  const results: StatisticsResult = {};

  for (const metric of metrics) {
    try {
      const value = metric.calculate(items);
      results[metric.key] = {
        label: metric.label,
        value,
        formatted: metric.format ? metric.format(value) : String(value),
        description: metric.description,
      };
    } catch (error) {
      console.error(`Error calculating metric ${metric.key}:`, error);
      results[metric.key] = {
        label: metric.label,
        value: 'N/A',
        formatted: 'N/A',
        description: metric.description,
      };
    }
  }

  return results;
}

/**
 * Common statistical functions
 */
export const StatFunctions = {
  /**
   * Count total items
   */
  count: <T>(items: T[]): number => items.length,

  /**
   * Count items matching a condition
   */
  countWhere: <T>(items: T[], predicate: (item: T) => boolean): number =>
    items.filter(predicate).length,

  /**
   * Calculate sum of numeric values
   */
  sum: <T>(items: T[], getValue: (item: T) => number): number =>
    items.reduce((acc, item) => acc + getValue(item), 0),

  /**
   * Calculate average of numeric values
   */
  average: <T>(items: T[], getValue: (item: T) => number): number => {
    if (items.length === 0) return 0;
    return StatFunctions.sum(items, getValue) / items.length;
  },

  /**
   * Find minimum value
   */
  min: <T>(items: T[], getValue: (item: T) => number): number => {
    if (items.length === 0) return 0;
    return Math.min(...items.map(getValue));
  },

  /**
   * Find maximum value
   */
  max: <T>(items: T[], getValue: (item: T) => number): number => {
    if (items.length === 0) return 0;
    return Math.max(...items.map(getValue));
  },

  /**
   * Calculate median value
   */
  median: <T>(items: T[], getValue: (item: T) => number): number => {
    if (items.length === 0) return 0;
    const sorted = [...items].map(getValue).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },

  /**
   * Calculate percentage
   */
  percentage: (part: number, total: number): number => {
    if (total === 0) return 0;
    return (part / total) * 100;
  },

  /**
   * Group items by a key
   */
  groupBy: <T, K extends string | number>(
    items: T[],
    getKey: (item: T) => K
  ): Record<K, T[]> => {
    return items.reduce((acc, item) => {
      const key = getKey(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<K, T[]>);
  },

  /**
   * Count occurrences of each unique value
   */
  countByValue: <T, K extends string | number>(
    items: T[],
    getValue: (item: T) => K
  ): Record<K, number> => {
    return items.reduce((acc, item) => {
      const value = getValue(item);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<K, number>);
  },

  /**
   * Find most common value
   */
  mode: <T, K extends string | number>(items: T[], getValue: (item: T) => K): K | null => {
    if (items.length === 0) return null;
    const counts = StatFunctions.countByValue(items, getValue);
    let maxCount = 0;
    let modeValue: K | null = null;
    for (const [value, count] of Object.entries(counts)) {
      const countNum = count as number;
      if (countNum > maxCount) {
        maxCount = countNum;
        modeValue = value as K;
      }
    }
    return modeValue;
  },
};

/**
 * Common formatters
 */
export const Formatters = {
  /**
   * Format as integer
   */
  integer: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return Math.round(num).toLocaleString('zh-CN');
  },

  /**
   * Format as decimal with specified precision
   */
  decimal: (precision: number = 2) => (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(precision);
  },

  /**
   * Format as percentage
   */
  percentage: (precision: number = 1) => (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(precision)}%`;
  },

  /**
   * Format as currency (CNY)
   */
  currency: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  /**
   * Format as compact number (K, M, B)
   */
  compact: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  },
};

/**
 * Pre-defined common metrics for items
 */
export const CommonMetrics = {
  /**
   * Total count metric
   */
  totalCount: <T>(): MetricDefinition<T> => ({
    key: 'total',
    label: '总数量',
    calculate: (items) => StatFunctions.count(items),
    format: Formatters.integer,
  }),

  /**
   * Count by status metric
   */
  countByStatus: (status: string, label: string): MetricDefinition<Item> => ({
    key: `count_${status}`,
    label,
    calculate: (items) => StatFunctions.countWhere(items, (item) => item.status === status),
    format: Formatters.integer,
  }),

  /**
   * Average numeric attribute metric
   */
  averageAttribute: (
    attributeKey: string,
    label: string,
    precision: number = 2
  ): MetricDefinition<Item> => ({
    key: `avg_${attributeKey}`,
    label,
    calculate: (items) =>
      StatFunctions.average(
        items.filter((item) => typeof item.attributes[attributeKey] === 'number'),
        (item) => item.attributes[attributeKey] as number
      ),
    format: Formatters.decimal(precision),
  }),

  /**
   * Sum numeric attribute metric
   */
  sumAttribute: (attributeKey: string, label: string): MetricDefinition<Item> => ({
    key: `sum_${attributeKey}`,
    label,
    calculate: (items) =>
      StatFunctions.sum(
        items.filter((item) => typeof item.attributes[attributeKey] === 'number'),
        (item) => item.attributes[attributeKey] as number
      ),
    format: Formatters.integer,
  }),

  /**
   * Most common attribute value metric
   */
  modeAttribute: (attributeKey: string, label: string): MetricDefinition<Item> => ({
    key: `mode_${attributeKey}`,
    label,
    calculate: (items) => {
      const value = StatFunctions.mode(items, (item) => item.attributes[attributeKey]);
      return value ?? 'N/A';
    },
  }),

  /**
   * Percentage by condition metric
   */
  percentageWhere: <T>(
    key: string,
    label: string,
    predicate: (item: T) => boolean
  ): MetricDefinition<T> => ({
    key,
    label,
    calculate: (items) => {
      const count = StatFunctions.countWhere(items, predicate);
      return StatFunctions.percentage(count, items.length);
    },
    format: Formatters.percentage(1),
  }),
};

/**
 * Time-based statistics
 */
export const TimeStats = {
  /**
   * Count items created in date range
   */
  countInDateRange: (
    items: Item[],
    startDate: Date,
    endDate: Date
  ): number => {
    return StatFunctions.countWhere(
      items,
      (item) => item.createdAt >= startDate && item.createdAt <= endDate
    );
  },

  /**
   * Group items by time period
   */
  groupByPeriod: (
    items: Item[],
    period: 'day' | 'week' | 'month' | 'year'
  ): Record<string, Item[]> => {
    return StatFunctions.groupBy(items, (item) => {
      const date = new Date(item.createdAt);
      switch (period) {
        case 'day':
          return date.toISOString().split('T')[0];
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().split('T')[0];
        }
        case 'month':
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        case 'year':
          return String(date.getFullYear());
      }
    });
  },

  /**
   * Calculate growth rate
   */
  calculateGrowthRate: (
    items: Item[],
    currentPeriodStart: Date,
    previousPeriodStart: Date,
    periodEnd: Date
  ): number => {
    const currentCount = TimeStats.countInDateRange(items, currentPeriodStart, periodEnd);
    const previousCount = TimeStats.countInDateRange(
      items,
      previousPeriodStart,
      currentPeriodStart
    );

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    return ((currentCount - previousCount) / previousCount) * 100;
  },
};

/**
 * Distribution statistics
 */
export const DistributionStats = {
  /**
   * Calculate distribution of values
   */
  getDistribution: <T, K extends string | number>(
    items: T[],
    getValue: (item: T) => K
  ): Array<{ value: K; count: number; percentage: number }> => {
    const counts = StatFunctions.countByValue(items, getValue);
    const total = items.length;

    return Object.entries(counts).map(([value, count]) => ({
      value: value as K,
      count: count as number,
      percentage: StatFunctions.percentage(count as number, total),
    }));
  },

  /**
   * Get top N values by count
   */
  getTopValues: <T, K extends string | number>(
    items: T[],
    getValue: (item: T) => K,
    n: number = 5
  ): Array<{ value: K; count: number }> => {
    const counts = StatFunctions.countByValue(items, getValue);
    return Object.entries(counts)
      .map(([value, count]) => ({ value: value as K, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  },
};

/**
 * Export all statistics utilities
 */
export default {
  calculateStatistics,
  StatFunctions,
  Formatters,
  CommonMetrics,
  TimeStats,
  DistributionStats,
};
