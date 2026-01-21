/**
 * Setup REST API - Database Seeding
 *
 * GET /api/setup - Check database status
 * POST /api/setup - Seed database with sample data (Schema creation handled by Drizzle)
 *
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.5 - Rate limiting
 */

import { NextRequest } from 'next/server';
import { countQuilts, createQuilt } from '@/lib/data/quilts';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.database, async () => {
    try {
      // Schema is managed by Drizzle Kit (npm run db:push), so we skip table creation here.
      // We only handle seeding if the database is empty.

      // Check if database is already set up
      const quiltCount = await countQuilts();

      if (quiltCount > 0) {
        return createSuccessResponse({
          message: '数据库已包含数据，无需初始化',
          quilts: quiltCount,
        });
      }

      // Create sample quilts using data access layer
      const quilts = await Promise.all([
        createQuilt({
          name: 'Premium Down Winter Quilt',
          season: 'WINTER',
          lengthCm: 220,
          widthCm: 200,
          weightGrams: 2500,
          fillMaterial: 'Goose Down',
          materialDetails: '90% Goose Down, 10% Feathers',
          color: 'White',
          brand: 'Nordic Dreams',
          purchaseDate: new Date('2023-10-15'),
          location: 'Master Bedroom Closet',
          packagingInfo: 'Vacuum sealed bag',
          currentStatus: 'STORAGE',
          notes: 'Excellent for very cold nights',
        }),
        createQuilt({
          name: 'Cotton Comfort Quilt',
          season: 'SPRING_AUTUMN',
          lengthCm: 200,
          widthCm: 180,
          weightGrams: 1200,
          fillMaterial: 'Cotton',
          materialDetails: '100% Organic Cotton',
          color: 'Light Blue',
          brand: 'EcoSleep',
          purchaseDate: new Date('2023-03-10'),
          location: 'Master Bedroom',
          packagingInfo: 'Breathable cotton bag',
          currentStatus: 'STORAGE',
          notes: 'Perfect for mild weather',
        }),
        createQuilt({
          name: 'Light Summer Quilt',
          season: 'SUMMER',
          lengthCm: 200,
          widthCm: 180,
          weightGrams: 600,
          fillMaterial: 'Cotton',
          materialDetails: '100% Lightweight Cotton',
          color: 'Pastel Pink',
          brand: 'Summer Breeze',
          purchaseDate: new Date('2023-05-15'),
          location: 'Master Bedroom',
          packagingInfo: 'Mesh laundry bag',
          currentStatus: 'STORAGE',
          notes: 'Ultra-light for hot summer nights',
        }),
      ]);

      return createSuccessResponse({
        message: '数据库初始化数据成功！',
        quilts: quilts.length,
        driver: 'Neon Serverless Driver (via Drizzle)',
      });
    } catch (error) {
      return createInternalErrorResponse('数据库初始化失败', error);
    }
  });
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, rateLimiters.api, async () => {
    try {
      // Check database status using data access layer
      const quiltCount = await countQuilts();

      return createSuccessResponse({
        status: '数据库已连接',
        quilts: quiltCount,
        initialized: quiltCount > 0,
        driver: 'Neon Serverless Driver (via Drizzle)',
      });
    } catch (error) {
      return createInternalErrorResponse('数据库连接失败', error);
    }
  });
}
