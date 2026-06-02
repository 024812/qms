/**
 * System Info API Route
 *
 * Returns system information including version from package.json
 *
 * Requirements: 5.3 - Consistent API response format
 */

import packageJson from '../../../../../package.json';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';
import { requireApiAdmin } from '@/lib/api/route-auth';

export async function GET() {
  try {
    const authResult = await requireApiAdmin();
    if (!authResult.ok) return authResult.response;

    return createSuccessResponse({
      systemInfo: {
        version: packageJson.version,
        framework: 'Next.js 16',
        deployment: 'Vercel',
        database: 'Neon PostgreSQL',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    return createInternalErrorResponse('获取系统信息失败', error);
  }
}
