/**
 * Export Data REST API
 *
 * GET /api/settings/export - Export all data
 *
 * Requirements: 1.2, 1.3 - REST API for settings
 * Requirements: 5.3 - Consistent API response format
 */

import { getQuilts } from '@/lib/data/quilts';
import { getUsageRecords } from '@/lib/data/usage';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

/**
 * GET /api/settings/export
 *
 * Export all data including:
 * - All quilts
 * - All usage records
 * - Export timestamp
 */
export async function GET() {
  try {
    const quilts = await getQuilts();
    const usageRecords = await getUsageRecords();

    return createSuccessResponse({
      export: {
        exportDate: new Date().toISOString(),
        quilts,
        usageRecords,
      },
    });
  } catch (error) {
    return createInternalErrorResponse('导出数据失败', error);
  }
}
