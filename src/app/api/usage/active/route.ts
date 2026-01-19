/**
 * Active Usage Records REST API
 *
 * GET /api/usage/active - Get all active usage records (end_date is NULL)
 *
 * Requirements: 1.2, 1.3 - REST API for usage records
 * Requirements: 5.3 - Consistent API response format
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
