/**
 * Usage Records by Quilt REST API
 *
 * GET /api/usage/by-quilt/[quiltId] - Get all usage records for a specific quilt
 *
 * Requirements: 1.2, 1.3 - REST API for usage records
 * Requirements: 5.3 - Consistent API response format
 */

import { NextRequest } from 'next/server';
import { getUsageHistory, getActiveUsageRecord, getUsageStats } from '@/lib/data/usage';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ quiltId: string }>;
}

/**
 * GET /api/usage/by-quilt/[quiltId]
 *
 * Get all usage records for a specific quilt.
 *
 * Query Parameters:
 * - includeStats: boolean (optional) - Include usage statistics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { quiltId } = await params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Fetch usage records for the quilt
    const records = await getUsageHistory(quiltId);

    // Optionally include statistics
    let stats = null;
    if (includeStats) {
      stats = await getUsageStats(quiltId);
    }

    // Get active record if any
    const activeRecord = await getActiveUsageRecord(quiltId);

    return createSuccessResponse(
      {
        records,
        activeRecord,
        ...(stats && { stats }),
      },
      {
        total: records.length,
        hasMore: false,
      }
    );
  } catch (error) {
    return createInternalErrorResponse('获取被子使用记录失败', error);
  }
}
