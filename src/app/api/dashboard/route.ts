/**
 * Dashboard REST API - Statistics and Overview
 *
 * GET /api/dashboard - Get comprehensive dashboard statistics
 *
 * Requirements: 1.2, 1.3 - REST API for dashboard
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 6.1, 6.2 - Repository pattern for database operations
 */

import { dbLogger } from '@/lib/logger';
import { getDashboardStats } from '@/lib/data/stats';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

/**
 * GET /api/dashboard
 *
 * Get comprehensive dashboard statistics including:
 * - Overview counts (total quilts, in use, storage, maintenance)
 * - Seasonal distribution
 * - Quilts currently in use
 * - Historical usage data for this day in previous years
 */
export async function GET() {
  try {
    // Use data access layer for all database operations
    const dashboardStats = await getDashboardStats();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const monthDay = `${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    const dashboardData = {
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
      inUseQuilts: dashboardStats.inUseQuilts,
      historicalUsage: dashboardStats.historicalUsage,
      date: {
        today: today.toISOString(),
        monthDay,
      },
      lastUpdated: new Date(),
    };

    return createSuccessResponse({ dashboard: dashboardData });
  } catch (error) {
    dbLogger.error('Failed to fetch dashboard stats', { error });
    return createInternalErrorResponse('获取仪表板数据失败', error);
  }
}
