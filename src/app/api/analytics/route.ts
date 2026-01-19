/**
 * Analytics REST API
 *
 * GET /api/analytics - Get comprehensive analytics data
 *
 * Requirements: 1.2, 1.3 - REST API for analytics
 * Requirements: 5.1, 5.2 - Database-level queries for efficiency
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 6.1, 6.2 - Repository pattern for database operations
 */

import { NextRequest } from 'next/server';
import { getAnalyticsData } from '@/lib/data/stats';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

// GET /api/analytics - Get comprehensive analytics data
export async function GET(_request: NextRequest) {
  try {
    // Use data access layer for all database operations
    const analyticsData = await getAnalyticsData();

    return createSuccessResponse({
      analytics: {
        overview: analyticsData.overview,
        statusDistribution: {
          IN_USE: analyticsData.statusDistribution.inUse,
          STORAGE: analyticsData.statusDistribution.storage,
          MAINTENANCE: analyticsData.statusDistribution.maintenance,
        },
        seasonDistribution: analyticsData.seasonDistribution,
        usageBySeason: analyticsData.usageBySeason,
        mostUsedQuilts: analyticsData.mostUsedQuilts,
        usageByYear: analyticsData.usageByYear.map(item => ({
          year: parseInt(item.period),
          count: item.count,
        })),
        usageByMonth: analyticsData.usageByMonth.map(item => ({
          month: item.period,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    return createInternalErrorResponse('获取分析数据失败', error);
  }
}
