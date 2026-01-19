/**
 * Quilt Module Schema
 *
 * This module schema wraps and adapts the existing comprehensive quilt management system
 * to work with the extensible item management framework.
 *
 * IMPORTANT: This schema PRESERVES all existing functionality and data structures.
 * It does NOT migrate to a simplified schema - it uses the existing comprehensive one.
 *
 * The existing system includes:
 * - Complete `quilts` table with detailed fields (item_number, season, dimensions, materials, images, etc.)
 * - Full repository layer (src/lib/repositories/quilt.repository.ts)
 * - Usage tracking with `usage_records` table
 * - Image management (main_image, attachment_images)
 * - Complete Zod validation schemas in src/lib/validations/quilt.ts
 *
 * This schema acts as an adapter layer between the framework's module system
 * and the existing quilt management implementation.
 */

// ============================================================================
// Re-export existing types and schemas
// ============================================================================

// Import and re-export all existing Zod schemas
export {
  // Zod schemas for enums
  SeasonSchema,
  QuiltStatusSchema,
  UsageTypeSchema,

  // Main schemas
  QuiltSchema,
  UsageRecordSchema,
  MaintenanceRecordSchema,
  createQuiltSchema,
  updateQuiltSchema,
  createUsagePeriodSchema,
  createCurrentUsageSchema,
  endCurrentUsageSchema,
  quiltFiltersSchema,
  quiltSearchSchema,
  createMaintenanceRecordSchema,
  analyticsDateRangeSchema,
  dashboardStatsSchema,
} from '@/lib/validations/quilt';

// Re-export types
export type {
  Season,
  QuiltStatus,
  UsageType,
  Quilt,
  UsageRecord,
  MaintenanceRecord,
  CreateQuiltInput,
  UpdateQuiltInput,
  CreateUsagePeriodInput,
  CreateCurrentUsageInput,
  EndCurrentUsageInput,
  QuiltFiltersInput,
  QuiltSearchInput,
  CreateMaintenanceRecordInput,
  AnalyticsDateRangeInput,
  DashboardStatsInput,
} from '@/lib/validations/quilt';

// Import and re-export database types and transformers
export type { QuiltRow, UsageRecordRow, MaintenanceRecordRow } from '@/lib/database/types';

export {
  rowToQuilt,
  quiltToRow,
  rowToUsageRecord,
  usageRecordToRow,
  rowToMaintenanceRecord,
  maintenanceRecordToRow,
  isSeason,
  isQuiltStatus,
  isUsageType,
} from '@/lib/database/types';

// ============================================================================
// Module Adapter Schema
// ============================================================================

import { z } from 'zod';
import { QuiltSchema } from '@/lib/validations/quilt';

/**
 * Quilt Attributes Schema for the module registry
 *
 * This wraps the existing comprehensive Quilt schema to make it compatible
 * with the module registry system while preserving all existing fields.
 */
export const quiltAttributesSchema = QuiltSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for quilt attributes (all fields except id, createdAt, updatedAt)
 */
export type QuiltAttributes = z.infer<typeof quiltAttributesSchema>;

/**
 * Extended Quilt type that includes the base Item fields
 * This is exported for use in UI components and tests
 */
export interface QuiltItem {
  id: string;
  type: 'quilt';
  createdAt: Date;
  updatedAt: Date;
  itemNumber: number;
  groupId: number | null;
  name: string;
  season: 'WINTER' | 'SPRING_AUTUMN' | 'SUMMER';
  lengthCm: number | null;
  widthCm: number | null;
  weightGrams: number | null;
  fillMaterial: string;
  materialDetails: string | null;
  color: string;
  brand: string | null;
  purchaseDate: Date | null;
  location: string;
  packagingInfo: string | null;
  currentStatus: 'IN_USE' | 'MAINTENANCE' | 'STORAGE';
  notes: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  mainImage: string | null;
  attachmentImages: string[] | null;
}

/**
 * Helper function to convert a Quilt to QuiltItem format
 * This is used when interfacing with the module registry system
 */
export function quiltToQuiltItem(quilt: import('@/lib/validations/quilt').Quilt): QuiltItem {
  return {
    id: quilt.id,
    type: 'quilt',
    createdAt: quilt.createdAt,
    updatedAt: quilt.updatedAt,
    itemNumber: quilt.itemNumber,
    groupId: quilt.groupId,
    name: quilt.name,
    season: quilt.season,
    lengthCm: quilt.lengthCm,
    widthCm: quilt.widthCm,
    weightGrams: quilt.weightGrams,
    fillMaterial: quilt.fillMaterial,
    materialDetails: quilt.materialDetails,
    color: quilt.color,
    brand: quilt.brand,
    purchaseDate: quilt.purchaseDate,
    location: quilt.location,
    packagingInfo: quilt.packagingInfo,
    currentStatus: quilt.currentStatus,
    notes: quilt.notes,
    imageUrl: quilt.imageUrl,
    thumbnailUrl: quilt.thumbnailUrl,
    mainImage: quilt.mainImage,
    attachmentImages: quilt.attachmentImages,
  };
}

/**
 * Helper function to convert QuiltItem back to Quilt format
 * This is used when interfacing with the existing repository layer
 */
export function quiltItemToQuilt(item: QuiltItem): import('@/lib/validations/quilt').Quilt {
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemNumber: item.itemNumber,
    groupId: item.groupId,
    name: item.name,
    season: item.season,
    lengthCm: item.lengthCm,
    widthCm: item.widthCm,
    weightGrams: item.weightGrams,
    fillMaterial: item.fillMaterial,
    materialDetails: item.materialDetails,
    color: item.color,
    brand: item.brand,
    purchaseDate: item.purchaseDate,
    location: item.location,
    packagingInfo: item.packagingInfo,
    currentStatus: item.currentStatus,
    notes: item.notes,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl,
    mainImage: item.mainImage,
    attachmentImages: item.attachmentImages,
  };
}

// ============================================================================
// Module Registry Compatibility
// ============================================================================

/**
 * This schema is designed to work with the module registry system while
 * maintaining full compatibility with the existing quilt management system.
 *
 * Key design decisions:
 * 1. Re-export all existing types and schemas for backward compatibility
 * 2. Provide adapter functions to convert between framework and existing formats
 * 3. Preserve all existing validation rules and business logic
 * 4. Maintain compatibility with existing repository layer
 * 5. Support existing usage tracking and maintenance record systems
 *
 * The existing system should continue to work exactly as before, with this
 * module schema serving as a bridge to the new framework capabilities.
 */
