/**
 * Active usage HTTP compatibility route.
 *
 * Internal app flows use the DAL + server action path. This route remains as
 * an external HTTP surface for active usage queries.
 */

import { getAllActiveUsageRecords } from '@/lib/data/usage';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

/**
 * GET /api/usage/active
 *
 * Get all active usage records (records where end_date is NULL).
 * These represent quilts that are currently in use.
 */
export async function GET() {
  try {
    const records = await getAllActiveUsageRecords();

    return createSuccessResponse({ records }, { total: records.length, hasMore: false });
  } catch (error) {
    return createInternalErrorResponse('获取活跃使用记录失败', error);
  }
}
