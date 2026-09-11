/**
 * Maps Module Schema
 *
 * This module schema defines the structure for managing map collections.
 * It supports various map types, materials, and geographic information.
 *
 * Requirements: V3 API-first blueprint
 */

import { z } from 'zod';

// ============================================================================
// Enum Definitions
// ============================================================================

/**
 * Map types supported
 */
export const MapType = {
  TOPOGRAPHIC: 'TOPOGRAPHIC',
  ROAD: 'ROAD',
  CITY: 'CITY',
  HISTORICAL: 'HISTORICAL',
  THEMATIC: 'THEMATIC',
  NAUTICAL: 'NAUTICAL',
  AERONAUTICAL: 'AERONAUTICAL',
  OTHER: 'OTHER',
} as const;

export type MapType = (typeof MapType)[keyof typeof MapType];

export const MapTypeSchema = z.enum([
  'TOPOGRAPHIC',
  'ROAD',
  'CITY',
  'HISTORICAL',
  'THEMATIC',
  'NAUTICAL',
  'AERONAUTICAL',
  'OTHER',
]);

/**
 * Map materials
 */
export const MapMaterial = {
  PAPER: 'PAPER',
  CLOTH: 'CLOTH',
  DIGITAL: 'DIGITAL',
  OTHER: 'OTHER',
} as const;

export type MapMaterial = (typeof MapMaterial)[keyof typeof MapMaterial];

export const MapMaterialSchema = z.enum(['PAPER', 'CLOTH', 'DIGITAL', 'OTHER']);

/**
 * Map status
 */
export const MapStatus = {
  COLLECTION: 'COLLECTION',
  FOR_SALE: 'FOR_SALE',
  SOLD: 'SOLD',
  DISPLAY: 'DISPLAY',
  FRAMED: 'FRAMED',
} as const;

export type MapStatus = (typeof MapStatus)[keyof typeof MapStatus];

export const MapStatusSchema = z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED']);

// ============================================================================
// Map Attributes Schema
// ============================================================================

/**
 * Map attributes schema for the module registry
 *
 * This defines all the fields specific to maps:
 * - Basic information (name, type, scale, publisher, year)
 * - Material and physical dimensions
 * - Geographic information (region, country, language)
 * - Condition and authenticity (condition, isOriginal, edition)
 * - Acquisition and value tracking
 * - Storage and status information
 */
export const mapAttributesSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Map name is required').max(200, 'Name too long').trim(),

  mapType: MapTypeSchema,

  scale: z.string().max(100, 'Scale too long').optional(),

  publishedYear: z
    .number()
    .int('Year must be an integer')
    .min(1400, 'Year too old')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional(),

  publisher: z.string().max(200, 'Publisher name too long').optional(),

  // Material and Dimensions
  material: MapMaterialSchema.optional().default('PAPER'),

  widthCm: z.number().positive('Width must be positive').optional(),

  heightCm: z.number().positive('Height must be positive').optional(),

  // Geographic Information
  region: z.string().max(200, 'Region name too long').optional(),

  country: z.string().max(100, 'Country name too long').optional(),

  language: z.string().max(100, 'Language too long').optional(),

  // Condition and Authenticity
  condition: z.string().max(500, 'Condition description too long').optional(),

  isOriginal: z.boolean().optional().default(true),

  edition: z.string().max(100, 'Edition too long').optional(),

  // Acquisition Information
  acquiredDate: z.date().max(new Date(), 'Acquired date cannot be in the future').optional(),

  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),

  currentValue: z.number().min(0, 'Current value cannot be negative').optional(),

  // Status and Storage
  status: MapStatusSchema.optional().default('COLLECTION'),

  location: z.string().max(200, 'Location too long').optional(),

  notes: z.string().max(2000, 'Notes too long').optional(),

  // Images
  mainImage: z.string().optional(),

  attachmentImages: z.array(z.string()).optional(),
});

/**
 * Type for map attributes
 */
export type MapAttributes = z.infer<typeof mapAttributesSchema>;

// ============================================================================
// Complete Map Schema
// ============================================================================

/**
 * Complete Map Schema representing a map record
 */
export const MapSchema = z.object({
  id: z.string().uuid(),
  itemNumber: z.number().int().positive(),
  name: z.string(),
  mapType: MapTypeSchema,
  scale: z.string().nullable(),
  publishedYear: z.number().int().nullable(),
  publisher: z.string().nullable(),
  material: MapMaterialSchema,
  widthCm: z.number().nullable(),
  heightCm: z.number().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  language: z.string().nullable(),
  condition: z.string().nullable(),
  isOriginal: z.boolean(),
  edition: z.string().nullable(),
  acquiredDate: z.date().nullable(),
  purchasePrice: z.number().nullable(),
  currentValue: z.number().nullable(),
  status: MapStatusSchema,
  location: z.string().nullable(),
  notes: z.string().nullable(),
  mainImage: z.string().nullable(),
  attachmentImages: z.array(z.string()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Map type derived from MapSchema
 */
export type Map = z.infer<typeof MapSchema>;

/**
 * Extended Map type that includes the base Item fields
 */
export interface MapItem {
  id: string;
  type: 'map';
  createdAt: Date;
  updatedAt: Date;
  itemNumber: number;
  name: string;
  mapType: MapType;
  scale: string | null;
  publishedYear: number | null;
  publisher: string | null;
  material: MapMaterial;
  widthCm: number | null;
  heightCm: number | null;
  region: string | null;
  country: string | null;
  language: string | null;
  condition: string | null;
  isOriginal: boolean;
  edition: string | null;
  acquiredDate: Date | null;
  purchasePrice: number | null;
  currentValue: number | null;
  status: MapStatus;
  location: string | null;
  notes: string | null;
  mainImage: string | null;
  attachmentImages: string[] | null;
}

/**
 * Helper function to convert a Map to MapItem format
 */
export function mapToMapItem(map: Map): MapItem {
  return {
    id: map.id,
    type: 'map',
    createdAt: map.createdAt,
    updatedAt: map.updatedAt,
    itemNumber: map.itemNumber,
    name: map.name,
    mapType: map.mapType,
    scale: map.scale,
    publishedYear: map.publishedYear,
    publisher: map.publisher,
    material: map.material,
    widthCm: map.widthCm,
    heightCm: map.heightCm,
    region: map.region,
    country: map.country,
    language: map.language,
    condition: map.condition,
    isOriginal: map.isOriginal,
    edition: map.edition,
    acquiredDate: map.acquiredDate,
    purchasePrice: map.purchasePrice,
    currentValue: map.currentValue,
    status: map.status,
    location: map.location,
    notes: map.notes,
    mainImage: map.mainImage,
    attachmentImages: map.attachmentImages,
  };
}

/**
 * Helper function to convert MapItem back to Map format
 */
export function mapItemToMap(item: MapItem): Map {
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemNumber: item.itemNumber,
    name: item.name,
    mapType: item.mapType,
    scale: item.scale,
    publishedYear: item.publishedYear,
    publisher: item.publisher,
    material: item.material,
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    region: item.region,
    country: item.country,
    language: item.language,
    condition: item.condition,
    isOriginal: item.isOriginal,
    edition: item.edition,
    acquiredDate: item.acquiredDate,
    purchasePrice: item.purchasePrice,
    currentValue: item.currentValue,
    status: item.status,
    location: item.location,
    notes: item.notes,
    mainImage: item.mainImage,
    attachmentImages: item.attachmentImages,
  };
}

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Schema for creating a new map
 */
export const CreateMapInputSchema = mapAttributesSchema;

export type CreateMapInput = z.infer<typeof CreateMapInputSchema>;

/**
 * Schema for updating an existing map
 */
export const UpdateMapInputSchema = mapAttributesSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateMapInput = z.infer<typeof UpdateMapInputSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency value
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate value change percentage
 */
export function calculateValueChange(
  currentValue: number | null,
  purchasePrice: number | null
): { change: number; percentage: number } | null {
  if (!currentValue || !purchasePrice || purchasePrice === 0) return null;

  const change = currentValue - purchasePrice;
  const percentage = (change / purchasePrice) * 100;

  return {
    change: Math.round(change * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get map type display name in Chinese
 */
export function getMapTypeDisplayName(type: MapType): string {
  const typeMap: Record<MapType, string> = {
    TOPOGRAPHIC: '地形图',
    ROAD: '道路图',
    CITY: '城市图',
    HISTORICAL: '历史地图',
    THEMATIC: '专题地图',
    NAUTICAL: '航海图',
    AERONAUTICAL: '航空图',
    OTHER: '其他',
  };
  return typeMap[type] || type;
}

/**
 * Get material display name in Chinese
 */
export function getMaterialDisplayName(material: MapMaterial): string {
  const materialMap: Record<MapMaterial, string> = {
    PAPER: '纸质',
    CLOTH: '布质',
    DIGITAL: '数字',
    OTHER: '其他',
  };
  return materialMap[material] || material;
}

/**
 * Get status display name in Chinese
 */
export function getStatusDisplayName(status: MapStatus): string {
  const statusMap: Record<MapStatus, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    DISPLAY: '展示中',
    FRAMED: '已装裱',
  };
  return statusMap[status] || status;
}
