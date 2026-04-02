/**
 * Usage-by-quilt HTTP compatibility route.
 *
 * Internal app flows use the DAL + server action path. This route remains as
 * an external HTTP surface for quilt-scoped usage history.
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
