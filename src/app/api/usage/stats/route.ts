/**
 * Usage statistics HTTP compatibility route.
 *
 * Internal app flows use the DAL + server action path. This route remains as
 * an external HTTP surface for aggregate usage statistics.
 */

import { getSimpleUsageStats } from '@/lib/data/stats';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

/**
 * GET /api/usage/stats
 *
 * Get overall usage statistics via the canonical data access layer.
 *
 * Returns:
 * - total: Total number of usage records
 * - active: Number of active usage records (end_date is NULL)
 * - completed: Number of completed usage records
 */
export async function GET() {
  try {
    const stats = await getSimpleUsageStats();

    return createSuccessResponse({ stats });
  } catch (error) {
    return createInternalErrorResponse('获取使用统计失败', error);
  }
}
