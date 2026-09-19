/**
 * Reports REST API
 *
 * GET /api/reports - Get report data
 *
 * Requirements: 1.2, 1.3 - REST API for reports
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 5.4 - Zod validation for all inputs
 * Report reads use the canonical reports data layer; aggregate statistics are
 * composed there from the canonical stats data layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAnalyticsReport,
  getInventoryReport,
  getStatusReport,
  getUsageReport,
} from '@/lib/data/reports';
import type {
  InventoryReport,
  UsageReport,
  StatusReport,
  AnalyticsReport,
} from '@/lib/data/reports';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';
import { requireApiModule } from '@/lib/api/route-auth';
import { zodFieldErrors } from '@/lib/api/action-result';

// Zod schema for report query parameters
const reportQuerySchema = z.object({
  type: z.enum(['inventory', 'usage', 'analytics', 'status']).default('inventory'),
  format: z.enum(['json', 'csv']).default('json'),
});

type ReportType = z.infer<typeof reportQuerySchema>['type'];
type ReportDataByType = {
  inventory: InventoryReport;
  usage: UsageReport;
  analytics: AnalyticsReport;
  status: StatusReport;
};
type CsvCell = string | number | Date | null | undefined;

// GET /api/reports - Get report data
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiModule('quilts');
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);

    // Validate query parameters using Zod
    const validationResult = reportQuerySchema.safeParse({
      type: searchParams.get('type') || undefined,
      format: searchParams.get('format') || undefined,
    });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '报告参数验证失败',
        zodFieldErrors(validationResult.error)
      );
    }

    const { type: reportType, format } = validationResult.data;

    let reportData: ReportDataByType[ReportType];

    switch (reportType) {
      case 'inventory':
        reportData = await getInventoryReport();
        break;
      case 'usage':
        reportData = await getUsageReport();
        break;
      case 'analytics':
        reportData = await getAnalyticsReport();
        break;
      case 'status':
        reportData = await getStatusReport();
        break;
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData, reportType);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return createSuccessResponse({
      reportType,
      generatedAt: new Date().toISOString(),
      report: reportData,
    });
  } catch (error) {
    return createInternalErrorResponse('生成报告失败', error);
  }
}

function convertToCSV(data: ReportDataByType[ReportType], reportType: ReportType): string {
  let headers: string[] = [];
  let rows: CsvCell[][] = [];

  switch (reportType) {
    case 'inventory': {
      const inventoryData = data as InventoryReport;
      headers = [
        'Item Number',
        'Name',
        'Season',
        'Dimensions',
        'Weight',
        'Material',
        'Color',
        'Brand',
        'Location',
        'Status',
        'Notes',
      ];
      rows = inventoryData.quilts.map(q => [
        q.itemNumber,
        q.name,
        q.season,
        q.dimensions,
        q.weight,
        q.material,
        q.color,
        q.brand,
        q.location,
        q.status,
        q.notes,
      ]);
      break;
    }
    case 'usage': {
      const usageData = data as UsageReport;
      headers = [
        'Quilt Name',
        'Item Number',
        'Season',
        'Start Date',
        'End Date',
        'Duration Days',
        'Usage Type',
        'Notes',
      ];
      rows = usageData.usagePeriods.map(p => [
        p.quiltName,
        p.itemNumber,
        p.season,
        p.startDate,
        p.endDate,
        p.durationDays,
        p.usageType,
        p.notes,
      ]);
      break;
    }
    case 'status': {
      const statusData = data as StatusReport;
      headers = [
        'Item Number',
        'Name',
        'Status',
        'Season',
        'Location',
        'Last Updated',
        'Days in Status',
      ];
      rows = statusData.quilts.map(q => [
        q.itemNumber,
        q.name,
        q.status,
        q.season,
        q.location,
        q.lastUpdated,
        q.daysInCurrentStatus,
      ]);
      break;
    }
    default:
      headers = ['Data'];
      rows = [['No data available']];
  }

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  return csvContent;
}

function escapeCsvCell(cell: CsvCell): string {
  const value = cell instanceof Date ? cell.toISOString() : String(cell ?? '');
  // Prefix a leading formula trigger with a single quote to neutralize CSV/Excel
  // formula injection. Also covers leading whitespace before a trigger character.
  const safeValue = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
