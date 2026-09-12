/**
 * Paddles Module Schema
 *
 * This module schema defines the structure for managing table tennis paddle collections.
 * It supports blade characteristics, rubber configurations, and performance tracking.
 */

import { z } from 'zod';

// ============================================================================
// Enum Definitions
// ============================================================================

/**
 * Paddle status
 */
export const PaddleStatus = {
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
  FOR_SALE: 'FOR_SALE',
  SOLD: 'SOLD',
  DISPLAY: 'DISPLAY',
} as const;

export type PaddleStatus = (typeof PaddleStatus)[keyof typeof PaddleStatus];

export const PaddleStatusSchema = z.enum(['ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY']);

/**
 * Handle types
 */
export const HandleType = {
  FL: 'FL', // Flared
  ST: 'ST', // Straight
  CS: 'CS', // Chinese penhold
  AN: 'AN', // Anatomic
} as const;

export type HandleType = (typeof HandleType)[keyof typeof HandleType];

export const HandleTypeSchema = z.enum(['FL', 'ST', 'CS', 'AN']);

// ============================================================================
// Paddle Attributes Schema
// ============================================================================

/**
 * Paddle attributes schema for the module registry
 *
 * This defines all the fields specific to table tennis paddles:
 * - Basic information (name, blade brand, blade model)
 * - Physical characteristics (weight, handle type)
 * - Rubber configuration (forehand, backhand, thickness)
 * - Performance ratings (speed, control)
 * - Purchase and value tracking
 * - Status and condition information
 */
export const paddleAttributesSchema = z.object({
  // Basic Information
  itemNumber: z.number().int().positive().optional(),

  name: z.string().min(1, 'Name is required').max(200, 'Name too long').trim(),

  bladeBrand: z.string().max(100, 'Blade brand too long').optional().nullable(),

  bladeModel: z.string().max(100, 'Blade model too long').optional().nullable(),

  // Physical Characteristics
  bladeWeightG: z
    .number()
    .positive('Blade weight must be positive')
    .max(250, 'Blade weight too heavy')
    .optional()
    .nullable(),

  thicknessMm: z
    .number()
    .positive('Thickness must be positive')
    .max(20, 'Thickness too thick')
    .optional()
    .nullable(),

  handleType: HandleTypeSchema.optional().nullable(),

  // Rubber Configuration
  forehandRubber: z.string().max(100, 'Forehand rubber name too long').optional().nullable(),

  backhandRubber: z.string().max(100, 'Backhand rubber name too long').optional().nullable(),

  rubberThicknessMm: z
    .number()
    .min(0.5, 'Rubber thickness too thin')
    .max(4.0, 'Rubber thickness too thick')
    .optional()
    .nullable(),

  // Performance Ratings (1-10 scale)
  bladeSpeed: z
    .number()
    .int('Speed rating must be an integer')
    .min(1, 'Speed rating must be at least 1')
    .max(10, 'Speed rating cannot exceed 10')
    .optional()
    .nullable(),

  bladeControl: z
    .number()
    .int('Control rating must be an integer')
    .min(1, 'Control rating must be at least 1')
    .max(10, 'Control rating cannot exceed 10')
    .optional()
    .nullable(),

  // Purchase and Value
  purchaseDate: z.coerce.date().optional().nullable(),

  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional().nullable(),

  acquiredFrom: z.string().max(200, 'Source too long').optional().nullable(),

  currentValue: z.number().min(0, 'Current value cannot be negative').optional().nullable(),

  soldPrice: z.number().min(0, 'Sold price cannot be negative').optional().nullable(),

  soldDate: z.coerce.date().optional().nullable(),

  // Status and Condition
  status: PaddleStatusSchema.default('ACTIVE'),

  condition: z.string().max(500, 'Condition description too long').optional().nullable(),

  location: z.string().max(200, 'Location too long').optional().nullable(),

  notes: z.string().max(2000, 'Notes too long').optional().nullable(),

  // Images
  mainImage: z.string().url('Invalid image URL').optional().nullable(),

  attachmentImages: z.array(z.string().url('Invalid image URL')).optional().nullable(),
});

export type PaddleAttributes = z.infer<typeof paddleAttributesSchema>;

// ============================================================================
// Create and Update Schemas
// ============================================================================

/**
 * Schema for creating a new paddle
 */
export const createPaddleSchema = paddleAttributesSchema.omit({ itemNumber: true });

export type CreatePaddleInput = z.infer<typeof createPaddleSchema>;

/**
 * Schema for updating an existing paddle
 */
export const updatePaddleSchema = paddleAttributesSchema.partial().extend({
  id: z.string().uuid('Invalid paddle ID'),
});

export type UpdatePaddleInput = z.infer<typeof updatePaddleSchema>;

/**
 * Schema for paddle filters
 */
export const paddleFiltersSchema = z.object({
  status: PaddleStatusSchema.optional(),
  bladeBrand: z.string().optional(),
  handleType: HandleTypeSchema.optional(),
  search: z.string().optional(),
});

export type PaddleFilters = z.infer<typeof paddleFiltersSchema>;

// ============================================================================
// Paddle Item Type
// ============================================================================

/**
 * Extended Paddle type that includes all fields
 * This is exported for use in UI components and actions
 */
export interface PaddleItem {
  id: string;
  itemNumber: number;
  name: string;
  bladeBrand: string | null;
  bladeModel: string | null;
  bladeWeightG: number | null;
  thicknessMm: number | null;
  handleType: HandleType | null;
  forehandRubber: string | null;
  backhandRubber: string | null;
  rubberThicknessMm: number | null;
  bladeSpeed: number | null;
  bladeControl: number | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  acquiredFrom: string | null;
  currentValue: number | null;
  soldPrice: number | null;
  soldDate: Date | null;
  status: PaddleStatus;
  condition: string | null;
  location: string | null;
  notes: string | null;
  mainImage: string | null;
  attachmentImages: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to convert database row to PaddleItem
 */
export function rowToPaddleItem(row: Record<string, unknown>): PaddleItem {
  return {
    id: row.id as string,
    itemNumber: row.itemNumber as number,
    name: row.name as string,
    bladeBrand: (row.bladeBrand as string) ?? null,
    bladeModel: (row.bladeModel as string) ?? null,
    bladeWeightG:
      row.bladeWeightG !== null && row.bladeWeightG !== undefined ? Number(row.bladeWeightG) : null,
    thicknessMm:
      row.thicknessMm !== null && row.thicknessMm !== undefined ? Number(row.thicknessMm) : null,
    handleType: (row.handleType as HandleType) ?? null,
    forehandRubber: (row.forehandRubber as string) ?? null,
    backhandRubber: (row.backhandRubber as string) ?? null,
    rubberThicknessMm:
      row.rubberThicknessMm !== null && row.rubberThicknessMm !== undefined
        ? Number(row.rubberThicknessMm)
        : null,
    bladeSpeed: (row.bladeSpeed as number) ?? null,
    bladeControl: (row.bladeControl as number) ?? null,
    purchaseDate: row.purchaseDate ? new Date(row.purchaseDate as string) : null,
    purchasePrice:
      row.purchasePrice !== null && row.purchasePrice !== undefined
        ? Number(row.purchasePrice)
        : null,
    acquiredFrom: (row.acquiredFrom as string) ?? null,
    currentValue:
      row.currentValue !== null && row.currentValue !== undefined ? Number(row.currentValue) : null,
    soldPrice: row.soldPrice !== null && row.soldPrice !== undefined ? Number(row.soldPrice) : null,
    soldDate: row.soldDate ? new Date(row.soldDate as string) : null,
    status: (row.status as PaddleStatus) ?? 'ACTIVE',
    condition: (row.condition as string) ?? null,
    location: (row.location as string) ?? null,
    notes: (row.notes as string) ?? null,
    mainImage: (row.mainImage as string) ?? null,
    attachmentImages: (row.attachmentImages as string[]) ?? null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}
