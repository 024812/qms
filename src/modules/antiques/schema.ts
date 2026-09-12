/**
 * Antiques Module Schema
 *
 * This module schema defines the structure for managing antique collections.
 * It supports various categories (jade, wood, ceramic, metal, stone, paper),
 * appraisal tracking, and value management.
 *
 * Requirements: V3 API-first blueprint
 */

import { z } from 'zod';

// ============================================================================
// Enum Definitions
// ============================================================================

/**
 * Antique categories
 */
export const AntiqueCategory = {
  JADE: 'JADE',
  WOOD: 'WOOD',
  CERAMIC: 'CERAMIC',
  METAL: 'METAL',
  STONE: 'STONE',
  PAPER: 'PAPER',
  TOOL: 'TOOL',
  OTHER: 'OTHER',
} as const;

export type AntiqueCategory = (typeof AntiqueCategory)[keyof typeof AntiqueCategory];

export const AntiqueCategorySchema = z.enum([
  'JADE',
  'WOOD',
  'CERAMIC',
  'METAL',
  'STONE',
  'PAPER',
  'TOOL',
  'OTHER',
]);

/**
 * Antique status
 */
export const AntiqueStatus = {
  COLLECTION: 'COLLECTION',
  FOR_SALE: 'FOR_SALE',
  SOLD: 'SOLD',
  DISPLAY: 'DISPLAY',
  APPRAISAL: 'APPRAISAL',
} as const;

export type AntiqueStatus = (typeof AntiqueStatus)[keyof typeof AntiqueStatus];

export const AntiqueStatusSchema = z.enum([
  'COLLECTION',
  'FOR_SALE',
  'SOLD',
  'DISPLAY',
  'APPRAISAL',
]);

// ============================================================================
// Antique Attributes Schema
// ============================================================================

/**
 * Antique attributes schema for the module registry
 *
 * This defines all the fields specific to antiques:
 * - Basic information (name, category, material, era, dynasty)
 * - Dimensions (length, width, height, weight)
 * - Condition and certification (condition, certificate, appraisal)
 * - Value tracking (purchase price, current value, estimated value)
 * - Acquisition details (acquired from, acquired date)
 * - Storage and status information
 */
export const antiqueAttributesSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').trim(),

  category: AntiqueCategorySchema,

  brand: z.string().max(100, 'Brand name too long').optional().nullable(),

  model: z.string().max(100, 'Model too long').optional().nullable(),

  subCategory: z.string().max(100, 'Subcategory too long').optional().nullable(),

  material: z.string().max(100, 'Material description too long').optional().nullable(),

  bladeSteel: z.string().max(100, 'Blade steel description too long').optional().nullable(),

  handleMaterial: z.string().max(100, 'Handle material description too long').optional().nullable(),

  lockType: z.string().max(50, 'Lock type too long').optional().nullable(),

  setGroup: z.string().max(50, 'Set group too long').optional().nullable(),

  era: z.string().max(100, 'Era description too long').optional().nullable(),

  dynasty: z.string().max(100, 'Dynasty name too long').optional().nullable(),

  // Dimensions (all optional as not all antiques have measurements)
  lengthCm: z
    .number()
    .positive('Length must be positive')
    .max(10000, 'Length too large')
    .optional()
    .nullable(),

  widthCm: z
    .number()
    .positive('Width must be positive')
    .max(10000, 'Width too large')
    .optional()
    .nullable(),

  heightCm: z
    .number()
    .positive('Height must be positive')
    .max(10000, 'Height too large')
    .optional()
    .nullable(),

  weightG: z
    .number()
    .positive('Weight must be positive')
    .max(1000000, 'Weight too large')
    .optional()
    .nullable(),

  // Condition and Certification
  condition: z.string().max(500, 'Condition description too long').optional().nullable(),

  certificate: z.string().max(200, 'Certificate info too long').optional().nullable(),

  appraisalDate: z.coerce.date().optional().nullable(),

  appraisalBy: z.string().max(200, 'Appraiser name too long').optional().nullable(),

  // Value Information
  purchasePrice: z
    .number()
    .nonnegative('Purchase price cannot be negative')
    .max(100000000, 'Purchase price too large')
    .optional()
    .nullable(),

  acquiredFrom: z.string().max(200, 'Acquisition source too long').optional().nullable(),

  acquiredDate: z.coerce.date().optional().nullable(),

  currentValue: z
    .number()
    .nonnegative('Current value cannot be negative')
    .max(100000000, 'Current value too large')
    .optional()
    .nullable(),

  estimatedValue: z
    .number()
    .nonnegative('Estimated value cannot be negative')
    .max(100000000, 'Estimated value too large')
    .optional()
    .nullable(),

  soldPrice: z
    .number()
    .nonnegative('Sold price cannot be negative')
    .max(100000000, 'Sold price too large')
    .optional()
    .nullable(),

  soldDate: z.coerce.date().optional().nullable(),

  // Storage and Status
  status: AntiqueStatusSchema.default('COLLECTION'),

  location: z.string().max(200, 'Location description too long').optional().nullable(),

  notes: z.string().max(2000, 'Notes too long').optional().nullable(),

  // Images
  mainImage: z.string().url('Invalid image URL').optional().or(z.literal('')).nullable(),

  attachmentImages: z.array(z.string().url('Invalid image URL')).optional().default([]),
});

/**
 * Type for antique attributes (all fields except id, createdAt, updatedAt, itemNumber)
 */
export type AntiqueAttributes = z.infer<typeof antiqueAttributesSchema>;

/**
 * Create antique input schema
 */
export const createAntiqueSchema = antiqueAttributesSchema;

export type CreateAntiqueInput = z.infer<typeof createAntiqueSchema>;

/**
 * Update antique input schema (all fields optional except constraints)
 */
export const updateAntiqueSchema = antiqueAttributesSchema.partial().extend({
  id: z.string().uuid('Invalid antique ID'),
});

export type UpdateAntiqueInput = z.infer<typeof updateAntiqueSchema>;

/**
 * Antique filters schema for list queries
 */
export const antiqueFiltersSchema = z.object({
  category: AntiqueCategorySchema.optional(),
  status: AntiqueStatusSchema.optional(),
  era: z.string().optional(),
  dynasty: z.string().optional(),
  search: z.string().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
});

export type AntiqueFilters = z.infer<typeof antiqueFiltersSchema>;

/**
 * Complete Antique item type including all fields
 */
export interface AntiqueItem {
  id: string;
  itemNumber: number;
  name: string;
  category: AntiqueCategory;
  brand: string | null;
  model: string | null;
  subCategory: string | null;
  material: string | null;
  bladeSteel: string | null;
  handleMaterial: string | null;
  lockType: string | null;
  setGroup: string | null;
  era: string | null;
  dynasty: string | null;
  lengthCm: string | null; // numeric stored as string
  widthCm: string | null;
  heightCm: string | null;
  weightG: string | null;
  condition: string | null;
  certificate: string | null;
  appraisalDate: string | null; // date stored as string (YYYY-MM-DD)
  appraisalBy: string | null;
  purchasePrice: string | null;
  acquiredFrom: string | null;
  acquiredDate: string | null;
  currentValue: string | null;
  estimatedValue: string | null;
  soldPrice: string | null;
  soldDate: string | null;
  status: AntiqueStatus;
  location: string | null;
  notes: string | null;
  mainImage: string | null;
  attachmentImages: string[];
  createdAt: Date;
  updatedAt: Date;
}
