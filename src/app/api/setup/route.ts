/**
 * Setup REST API - Database Initialization
 *
 * GET /api/setup - Check database status
 * POST /api/setup - Initialize database schema and sample data
 *
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.5 - Rate limiting
 */

import { NextRequest } from 'next/server';
import { sql } from '@/lib/neon';
import { countQuilts, createQuilt } from '@/lib/data/quilts';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { createSuccessResponse, createInternalErrorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.database, async () => {
    try {
      // First, create the database schema if it doesn't exist

      // Create quilts table
      await sql`
        CREATE TABLE IF NOT EXISTS quilts (
          id TEXT PRIMARY KEY,
          item_number INTEGER,
          group_id INTEGER,
          name TEXT NOT NULL,
          season TEXT CHECK (season IN ('WINTER', 'SPRING_AUTUMN', 'SUMMER')),
          length_cm INTEGER,
          width_cm INTEGER,
          weight_grams INTEGER,
          fill_material TEXT,
          material_details TEXT,
          color TEXT,
          brand TEXT,
          purchase_date TIMESTAMP,
          location TEXT,
          packaging_info TEXT,
          current_status TEXT CHECK (current_status IN ('IN_USE', 'MAINTENANCE', 'STORAGE')) DEFAULT 'STORAGE',
          notes TEXT,
          image_url TEXT,
          thumbnail_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create unified usage_records table
      await sql`
        CREATE TABLE IF NOT EXISTS usage_records (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          quilt_id TEXT NOT NULL REFERENCES quilts(id) ON DELETE CASCADE,
          start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          end_date TIMESTAMP,
          usage_type TEXT CHECK (usage_type IN ('REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION')) DEFAULT 'REGULAR',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create indexes for usage_records
      await sql`
        CREATE INDEX IF NOT EXISTS idx_usage_records_quilt_id 
        ON usage_records(quilt_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_usage_records_dates 
        ON usage_records(start_date, end_date)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_usage_records_active 
        ON usage_records(quilt_id) 
        WHERE end_date IS NULL
      `;

      // Create unique constraint: one active record per quilt
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_per_quilt
        ON usage_records(quilt_id)
        WHERE end_date IS NULL
      `;

      // Check if database is already set up
      const quiltCount = await countQuilts();

      if (quiltCount > 0) {
        return createSuccessResponse({
          message: '数据库架构已创建，已有数据',
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
        message: '数据库初始化成功！',
        quilts: quilts.length,
        driver: 'Neon Serverless Driver',
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
        driver: 'Neon Serverless Driver',
      });
    } catch (error) {
      return createInternalErrorResponse('数据库连接失败', error);
    }
  });
}
