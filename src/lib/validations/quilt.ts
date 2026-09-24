import { z } from 'zod';
import { attachmentImagesSchema, imageReferenceSchema } from '@/lib/validations/image';

// ============================================================================
// Enum Definitions - Single Source of Truth
// ============================================================================

export const Season = {
  WINTER: 'WINTER',
  SPRING_AUTUMN: 'SPRING_AUTUMN',
  SUMMER: 'SUMMER',
} as const;

// Note: AVAILABLE status removed per Requirements 7.2 - use STORAGE instead
export const QuiltStatus = {
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  STORAGE: 'STORAGE',
  LOST: 'LOST',
} as const;

export const UsageType = {
  REGULAR: 'REGULAR',
  GUEST: 'GUEST',
  SPECIAL_OCCASION: 'SPECIAL_OCCASION',
  SEASONAL_ROTATION: 'SEASONAL_ROTATION',
} as const;

// Export types for the enums
export type Season = (typeof Season)[keyof typeof Season];
export type QuiltStatus = (typeof QuiltStatus)[keyof typeof QuiltStatus];
export type UsageType = (typeof UsageType)[keyof typeof UsageType];

/**
 * Every quilt status, in display order — the runtime counterpart of
 * {@link QuiltStatus}, typed as a tuple so it can feed `z.enum()` directly.
 *
 * UI option lists, filter checkboxes and Agent tool enums must iterate this
 * instead of re-typing the literals. Blueprint §4.2 requires the DB enum, Zod
 * enum, UI options and stats dimensions to stay in lockstep, and a hand-copied
 * literal list is exactly how they drift. `quilt-status-enum.test.ts` asserts
 * the parity mechanically.
 */
export const QUILT_STATUSES = [
  QuiltStatus.IN_USE,
  QuiltStatus.STORAGE,
  QuiltStatus.MAINTENANCE,
  QuiltStatus.LOST,
] as const;

// Zod schemas for enums
export const SeasonSchema = z.enum(['WINTER', 'SPRING_AUTUMN', 'SUMMER']);
export const QuiltStatusSchema = z.enum(QUILT_STATUSES);
export const UsageTypeSchema = z.enum([
  'REGULAR',
  'GUEST',
  'SPECIAL_OCCASION',
  'SEASONAL_ROTATION',
]);

// Season-specific weight ranges (in grams)
const SEASON_WEIGHT_RANGES = {
  WINTER: { min: 1500, max: 5000 }, // Heavy quilts for cold weather
  SPRING_AUTUMN: { min: 800, max: 2000 }, // Medium weight for transitional seasons
  SUMMER: { min: 200, max: 1200 }, // Light quilts for warm weather
} as const;

/** A single cross-field business-rule violation. */
export interface QuiltBusinessRuleIssue {
  path: (string | number)[];
  message: string;
}

/** The subset of quilt fields the cross-field business rules depend on. */
export interface QuiltBusinessRuleInput {
  season?: Season;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
}

/**
 * Cross-field business rules for a quilt — the single source of truth.
 *
 * Every rule fires only when all the fields it needs are present, so the same
 * function serves three call sites with different field coverage:
 *
 * 1. `createQuiltSchema` — full payload, every rule applies.
 * 2. `updateQuiltSchema` — partial payload, rules apply only to supplied fields.
 * 3. `saveQuilt` (DAL update path) — called on the patch **merged onto the stored
 *    row**, which is what closes the "create legally, then PATCH into an illegal
 *    state" hole: a PATCH that only changes `season` is still checked against the
 *    already-stored `weightGrams`.
 *
 * Keep the rules here and nowhere else; blueprint §10.3 forbids two parallel
 * business-validation implementations.
 */
export function collectQuiltBusinessRuleIssues(
  data: QuiltBusinessRuleInput
): QuiltBusinessRuleIssue[] {
  const issues: QuiltBusinessRuleIssue[] = [];

  // Weight must be appropriate for the season.
  if (data.season !== undefined && data.weightGrams !== undefined) {
    const range = SEASON_WEIGHT_RANGES[data.season];
    if (data.weightGrams < range.min || data.weightGrams > range.max) {
      issues.push({
        path: ['weightGrams'],
        message: `Weight should be between ${range.min}g and ${range.max}g for ${data.season} season`,
      });
    }
  }

  // Dimensions should be reasonable (length should typically be >= width).
  if (data.lengthCm !== undefined && data.widthCm !== undefined) {
    if (!(data.lengthCm >= data.widthCm * 0.8)) {
      issues.push({
        path: ['lengthCm'],
        message: 'Length should typically be greater than or equal to width',
      });
    }
  }

  return issues;
}

/** Apply {@link collectQuiltBusinessRuleIssues} as a Zod refinement. */
function refineQuiltBusinessRules(data: QuiltBusinessRuleInput, ctx: z.RefinementCtx): void {
  for (const issue of collectQuiltBusinessRuleIssues(data)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: issue.message,
      path: issue.path,
    });
  }
}

// Base Quilt Schema object (without refinements)
const baseQuiltSchemaObject = z.object({
  itemNumber: z
    .number()
    .int('Item number must be an integer')
    .positive('Item number must be positive')
    .max(99999, 'Item number must be less than 100000')
    .optional(), // Optional for create, will be auto-generated
  groupId: z.number().int().positive().optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long (max 100 characters)')
    .trim()
    .optional(), // Optional for create, will be auto-generated
  season: z.enum(['WINTER', 'SPRING_AUTUMN', 'SUMMER'], {
    message: 'Invalid season. Must be WINTER, SPRING_AUTUMN, or SUMMER',
  }),
  lengthCm: z
    .number()
    .int('Length must be an integer')
    .positive('Length must be positive')
    .min(100, 'Length must be at least 100cm')
    .max(300, 'Length must be at most 300cm'),
  widthCm: z
    .number()
    .int('Width must be an integer')
    .positive('Width must be positive')
    .min(100, 'Width must be at least 100cm')
    .max(300, 'Width must be at most 300cm'),
  weightGrams: z
    .number()
    .int('Weight must be an integer')
    .positive('Weight must be positive')
    .min(100, 'Weight must be at least 100g')
    .max(10000, 'Weight must be at most 10kg'),
  fillMaterial: z
    .string()
    .min(1, 'Fill material is required')
    .max(50, 'Fill material too long (max 50 characters)')
    .trim(),
  materialDetails: z.string().max(500, 'Material details too long (max 500 characters)').optional(),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(30, 'Color too long (max 30 characters)')
    .trim(),
  brand: z.string().max(50, 'Brand too long (max 50 characters)').optional(),
  purchaseDate: z
    .date()
    .refine(date => date <= new Date(), 'Purchase date cannot be in the future')
    .optional(),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(100, 'Location too long (max 100 characters)')
    .trim(),
  packagingInfo: z.string().max(200, 'Packaging info too long (max 200 characters)').optional(),
  currentStatus: QuiltStatusSchema.optional().default('STORAGE'),
  notes: z.string().max(1000, 'Notes too long (max 1000 characters)').optional(),
  imageUrl: z.union([z.url('Invalid image URL'), z.literal('')]).optional(),
  thumbnailUrl: z.union([z.url('Invalid thumbnail URL'), z.literal('')]).optional(),
  mainImage: imageReferenceSchema.optional().nullable(),
  attachmentImages: attachmentImagesSchema.optional().nullable(),
});

// Create Quilt Schema with refinements
export const createQuiltSchema = baseQuiltSchemaObject.superRefine(refineQuiltBusinessRules);

// Update Quilt Schema (uses base object for partial support)
//
// The same business rules are attached here. They are evaluated against whatever
// fields the patch supplies; the merged-row check lives in `saveQuilt`, because a
// schema alone cannot see the stored record. Both call the same rule function, so
// there is only ever one implementation of the rules (blueprint §10.3).
export const updateQuiltSchema = baseQuiltSchemaObject
  .partial()
  .extend({
    id: z.string().min(1, 'Quilt ID is required'),
  })
  .superRefine(refineQuiltBusinessRules);

const recordIdSchema = z.string().min(1, 'ID is required');

// ============================================================================
// Complete Quilt Schema - Single Source of Truth for Quilt Type
// ============================================================================

/**
 * Complete Quilt Schema representing a quilt record from the database.
 * This is the single source of truth for the Quilt type.
 */
export const QuiltSchema = z.object({
  id: recordIdSchema,
  itemNumber: z.number().int().positive(),
  groupId: z.number().int().positive().nullable(),
  name: z.string(),
  season: SeasonSchema,
  lengthCm: z.number().int().positive(),
  widthCm: z.number().int().positive(),
  weightGrams: z.number().int().positive(),
  fillMaterial: z.string(),
  materialDetails: z.string().nullable(),
  color: z.string(),
  brand: z.string().nullable(),
  purchaseDate: z.date().nullable(),
  location: z.string(),
  packagingInfo: z.string().nullable(),
  currentStatus: QuiltStatusSchema,
  notes: z.string().nullable(),
  imageUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  mainImage: z.string().nullable(),
  attachmentImages: z.array(z.string()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Quilt type derived from QuiltSchema - use this throughout the application
 */
export type Quilt = z.infer<typeof QuiltSchema>;

/**
 * UsageRecord Schema representing a usage record from the database.
 */
export const UsageRecordSchema = z.object({
  id: recordIdSchema,
  quiltId: recordIdSchema,
  startDate: z.date(),
  endDate: z.date().nullable(),
  usageType: UsageTypeSchema,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * UsageRecord type derived from UsageRecordSchema
 */
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

/**
 * MaintenanceRecord Schema representing a maintenance record from the database.
 */
export const MaintenanceRecordSchema = z.object({
  id: recordIdSchema,
  quiltId: recordIdSchema,
  maintenanceType: z.string(),
  description: z.string(),
  performedAt: z.date(),
  cost: z.number().nullable(),
  nextDueDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * MaintenanceRecord type derived from MaintenanceRecordSchema
 */
export type MaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;

// Usage Schemas with enhanced validation
export const createUsagePeriodSchema = z
  .object({
    quiltId: z.string().min(1, 'Quilt ID is required'),
    startDate: z.date().max(new Date(), 'Start date cannot be in the future'),
    endDate: z.date().optional(),
    seasonUsed: z.string().max(50).optional(),
    usageType: z
      .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'], {
        message: 'Invalid usage type',
      })
      .optional()
      .default('REGULAR'),
    notes: z.string().max(500, 'Notes too long (max 500 characters)').optional(),
  })
  .refine(
    data => {
      // If endDate is provided, it must be after startDate
      if (data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      // If endDate is provided, it cannot be in the future
      if (data.endDate) {
        return data.endDate <= new Date();
      }
      return true;
    },
    {
      message: 'End date cannot be in the future',
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      // Usage period should not be longer than 1 year
      if (data.endDate) {
        const oneYear = 365 * 24 * 60 * 60 * 1000; // milliseconds in a year
        return data.endDate.getTime() - data.startDate.getTime() <= oneYear;
      }
      return true;
    },
    {
      message: 'Usage period cannot exceed 1 year',
      path: ['endDate'],
    }
  );

export const createCurrentUsageSchema = z
  .object({
    quiltId: z.string().min(1, 'Quilt ID is required'),
    startedAt: z.date().max(new Date(), 'Start date cannot be in the future'),
    expectedEndDate: z.date().optional(),
    usageType: z
      .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'], {
        message: 'Invalid usage type',
      })
      .optional()
      .default('REGULAR'),
    notes: z.string().max(500, 'Notes too long (max 500 characters)').optional(),
  })
  .refine(
    data => {
      // If expectedEndDate is provided, it must be after startedAt
      if (data.expectedEndDate) {
        return data.expectedEndDate > data.startedAt;
      }
      return true;
    },
    {
      message: 'Expected end date must be after start date',
      path: ['expectedEndDate'],
    }
  );

export const endCurrentUsageSchema = z.object({
  id: z.string().min(1, 'Usage ID is required'),
  endDate: z.date().max(new Date(), 'End date cannot be in the future').optional(),
  notes: z.string().max(500, 'Notes too long (max 500 characters)').optional(),
});

// Search and Filter Schemas
export const quiltFiltersSchema = z.object({
  season: z.enum(['WINTER', 'SPRING_AUTUMN', 'SUMMER']).optional(),
  status: QuiltStatusSchema.optional(),
  location: z.string().optional(),
  brand: z.string().optional(),
  minWeight: z.number().int().positive().optional(),
  maxWeight: z.number().int().positive().optional(),
  search: z.string().optional(),
});

export const quiltSearchSchema = z.object({
  filters: quiltFiltersSchema.optional().default({}),
  sortBy: z
    .enum(['itemNumber', 'name', 'season', 'weightGrams', 'createdAt', 'updatedAt'])
    .optional()
    .default('itemNumber'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  skip: z.number().int().min(0).optional().default(0),
  take: z.number().int().min(1).max(100).optional().default(20),
});

// Maintenance Schemas
export const createMaintenanceRecordSchema = z.object({
  quiltId: z.string(),
  type: z.string().min(1, 'Maintenance type is required'),
  description: z.string().min(1, 'Description is required'),
  performedAt: z.date(),
  cost: z.number().positive().optional(),
  nextDueDate: z.date().optional(),
});

// Analytics Schemas
export const analyticsDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export const dashboardStatsSchema = z.object({
  includeAnalytics: z.boolean().optional().default(true),
  includeTrends: z.boolean().optional().default(false),
});

// Export types
export type CreateQuiltInput = z.infer<typeof createQuiltSchema>;
export type UpdateQuiltInput = z.infer<typeof updateQuiltSchema>;
export type CreateUsagePeriodInput = z.infer<typeof createUsagePeriodSchema>;
export type CreateCurrentUsageInput = z.infer<typeof createCurrentUsageSchema>;
export type EndCurrentUsageInput = z.infer<typeof endCurrentUsageSchema>;
export type QuiltFiltersInput = z.infer<typeof quiltFiltersSchema>;
export type QuiltSearchInput = z.infer<typeof quiltSearchSchema>;
export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordSchema>;
export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>;
export type DashboardStatsInput = z.infer<typeof dashboardStatsSchema>;
