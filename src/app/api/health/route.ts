/**
 * Health Check REST API
 *
 * GET /api/health - Check application health status
 *
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 6.1, 6.2 - Repository pattern for database operations
 */

import { NextRequest } from 'next/server';
import { checkDatabaseHealth } from '@/db';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  return withRateLimit(request, rateLimiters.health, async () => {
    try {
      const isHealthy = await checkDatabaseHealth();

      if (!isHealthy) {
        throw new Error('Database connection failed');
      }

      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        database: 'connected',
      };

      return createSuccessResponse({ health: healthStatus });
    } catch (error) {
      console.error('Health check failed:', error);

      return createErrorResponse(
        'HEALTH_CHECK_FAILED',
        '健康检查失败',
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
        503
      );
    }
  });
}
