/**
 * Usage Statistics REST API
 *
 * GET /api/usage/stats - Get overall usage statistics
 *
 * Requirements: 1.2, 1.3 - REST API for usage records
 * Requirements: 5.1, 5.2 - Database query efficiency
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 6.1, 6.2 - Repository pattern for database operations
 */

import { getSimpleUsageStats } from '@/lib/data/stats';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

/**
 * GET /api/usage/stats
 *
 * Get overall usage statistics using repository pattern.
 *
 * Returns:
 * - total: Total number of usage records
 * - active: Number of active usage records (end_date is NULL)
 * - completed: Number of completed usage records
 */
export async function GET() {
  try {
    // Use data access layer for all database operations
    const stats = await getSimpleUsageStats();

    return createSuccessResponse({ stats });
  } catch (error) {
    return createInternalErrorResponse('获取使用统计失败', error);
  }
}
