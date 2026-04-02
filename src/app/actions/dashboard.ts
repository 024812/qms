'use server';

import { getDashboardStats } from '@/lib/data/stats';
import type { DashboardStatsView } from '@/lib/types/dashboard';

interface ActionSuccess<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ActionResult<T> = ActionSuccess<T> | ActionError;

function buildDashboardStatsView(): Promise<DashboardStatsView> {
  return getDashboardStats().then(dashboardStats => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const monthDay = `${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    return {
      overview: {
        totalQuilts: dashboardStats.statusCounts.total,
        inUseCount: dashboardStats.statusCounts.inUse,
        storageCount: dashboardStats.statusCounts.storage,
        maintenanceCount: dashboardStats.statusCounts.maintenance,
      },
      distribution: {
        seasonal: dashboardStats.seasonalCounts,
        location: {},
        brand: {},
      },
      topUsedQuilts: [],
      recentActivity: [],
      inUseQuilts: dashboardStats.inUseQuilts.map(quilt => ({
        ...quilt,
        itemNumber: quilt.itemNumber,
      })),
      historicalUsage: dashboardStats.historicalUsage.map(record => ({
        ...record,
        itemNumber: record.itemNumber,
        startDate: record.startDate.toISOString(),
        endDate: record.endDate ? record.endDate.toISOString() : null,
      })),
      date: {
        today: today.toISOString(),
        monthDay,
      },
      lastUpdated: new Date().toISOString(),
    };
  });
}

export async function getDashboardStatsAction(): Promise<ActionResult<DashboardStatsView>> {
  try {
    return {
      success: true,
      data: await buildDashboardStatsView(),
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to load dashboard statistics',
      },
    };
  }
}
