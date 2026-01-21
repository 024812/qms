/**
 * Database Stats REST API
 *
 * GET /api/settings/database-stats - Get database statistics
 *
 * Requirements: 1.2, 1.3 - REST API for settings
 * Requirements: 5.3 - Consistent API response format
 */

import { countQuilts } from '@/lib/data/quilts';
import { getSimpleUsageStats } from '@/lib/data/stats';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

/**
 * GET /api/settings/database-stats
 *
 * Get database statistics including:
 * - Total quilts count
 * - Total usage records count
 * - Active usage count
 * - Database provider info
 */
export async function GET() {
  try {
    const [quiltCount, usageStats] = await Promise.all([
      countQuilts(),
      getSimpleUsageStats(),
    ]);

    return createSuccessResponse({
      stats: {
        totalQuilts: quiltCount,
        totalUsageRecords: usageStats.total,
        activeUsage: usageStats.active,
        provider: 'Neon Serverless PostgreSQL (via Drizzle)',
        connected: true,
      },
    });
  } catch (error) {
    return createInternalErrorResponse('获取数据库统计失败', error);
  }
}
