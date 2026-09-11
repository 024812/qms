/**
 * Reports Data Access Layer
 *
 * Report-specific detail queries live here. Aggregate statistics are composed
 * from the canonical stats data layer instead of being queried again.
 */

import { db } from '@/db';
import { quilts, usageRecords } from '@/db/schema';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { getSeasonalCounts, getStatusCounts, getUsageBySeason, getUsageStats } from './stats';

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

export interface AnalyticsReport {
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
}

export async function getInventoryReport(): Promise<InventoryReport> {
  const [quiltsList, statusCounts, seasonCounts] = await Promise.all([
    db.select().from(quilts).orderBy(quilts.itemNumber),
    getStatusCounts(),
    getSeasonalCounts(),
  ]);

  return {
    summary: {
      totalQuilts: quiltsList.length,
      byStatus: {
        inUse: statusCounts.inUse,
        storage: statusCounts.storage,
        maintenance: statusCounts.maintenance,
      },
      bySeason: {
        winter: seasonCounts.WINTER,
        springAutumn: seasonCounts.SPRING_AUTUMN,
        summer: seasonCounts.SUMMER,
      },
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
}

export async function getUsageReport(): Promise<UsageReport> {
  const [records, usageStats] = await Promise.all([
    db
      .select({
        usageType: usageRecords.usageType,
        startDate: usageRecords.startDate,
        endDate: usageRecords.endDate,
        notes: usageRecords.notes,
        quiltName: quilts.name,
        itemNumber: quilts.itemNumber,
        season: quilts.season,
        durationDays: sql<number>`CASE WHEN ${usageRecords.endDate} IS NOT NULL
          THEN EXTRACT(DAY FROM (${usageRecords.endDate}::timestamp - ${usageRecords.startDate}::timestamp))
          ELSE NULL END`,
      })
      .from(usageRecords)
      .leftJoin(quilts, eq(usageRecords.quiltId, quilts.id))
      .orderBy(desc(usageRecords.startDate)),
    getUsageStats(),
  ]);

  const activeRecords = records.filter(record => !record.endDate);
  const completedRecords = records.filter(record => record.endDate);

  return {
    summary: {
      totalUsagePeriods: usageStats.totalPeriods,
      currentlyInUse: activeRecords.length,
      totalUsageDays: usageStats.totalDays,
      averageUsageDays: usageStats.avgDays,
    },
    usagePeriods: completedRecords.map(record => ({
      quiltName: record.quiltName || 'Unknown',
      itemNumber: record.itemNumber || 0,
      season: record.season || 'WINTER',
      startDate: new Date(record.startDate),
      endDate: record.endDate ? new Date(record.endDate) : null,
      durationDays: record.durationDays ? Math.floor(record.durationDays) : null,
      usageType: record.usageType || 'REGULAR',
      notes: record.notes,
    })),
    currentUsage: activeRecords.map(record => ({
      quiltName: record.quiltName || 'Unknown',
      itemNumber: record.itemNumber || 0,
      season: record.season || 'WINTER',
      startedAt: new Date(record.startDate),
      usageType: record.usageType || 'REGULAR',
      notes: record.notes,
      daysInUse: Math.floor(
        (new Date().getTime() - new Date(record.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
  };
}

export async function getAnalyticsReport(): Promise<AnalyticsReport> {
  const [statusCounts, seasonCounts, usageStats, usageBySeason] = await Promise.all([
    getStatusCounts(),
    getSeasonalCounts(),
    getUsageStats(),
    getUsageBySeason(),
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
}

export async function getStatusReport(): Promise<StatusReport> {
  const [quiltsList, statusCounts] = await Promise.all([
    db
      .select({
        itemNumber: quilts.itemNumber,
        name: quilts.name,
        currentStatus: quilts.currentStatus,
        season: quilts.season,
        location: quilts.location,
        updatedAt: quilts.updatedAt,
        usageStarted: usageRecords.startDate,
      })
      .from(quilts)
      .leftJoin(
        usageRecords,
        and(eq(quilts.id, usageRecords.quiltId), isNull(usageRecords.endDate))
      )
      .orderBy(quilts.currentStatus, quilts.itemNumber),
    getStatusCounts(),
  ]);

  return {
    summary: {
      inUse: statusCounts.inUse,
      storage: statusCounts.storage,
      maintenance: statusCounts.maintenance,
    },
    quilts: quiltsList.map(quilt => ({
      itemNumber: quilt.itemNumber,
      name: quilt.name,
      status: quilt.currentStatus,
      season: quilt.season,
      location: quilt.location,
      lastUpdated: new Date(quilt.updatedAt),
      usageStarted: quilt.usageStarted ? new Date(quilt.usageStarted) : null,
      daysInCurrentStatus: quilt.usageStarted
        ? Math.floor(
            (new Date().getTime() - new Date(quilt.usageStarted).getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    })),
  };
}
