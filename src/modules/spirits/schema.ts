/**
 * Spirits Module Schema
 *
 * Zod validation schemas and TypeScript types for the spirits module.
 * This is the single source of truth for spirits data validation.
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const SpiritTypeSchema = z.enum([
  'WHISKY',
  'COGNAC',
  'BRANDY',
  'RUM',
  'VODKA',
  'GIN',
  'TEQUILA',
  'BAIJIU',
  'WINE',
  'OTHER',
]);

export const SpiritStatusSchema = z.enum([
  'COLLECTION',
  'AGING',
  'FOR_SALE',
  'SOLD',
  'OPENED',
  'EMPTY',
]);

export const BottleStatusSchema = z.enum(['SEALED', 'OPENED', 'EMPTY']);

export type SpiritType = z.infer<typeof SpiritTypeSchema>;
export type SpiritStatus = z.infer<typeof SpiritStatusSchema>;
export type BottleStatus = z.infer<typeof BottleStatusSchema>;

// ============================================================================
// Core Schema
// ============================================================================

/**
 * Complete spirit schema (matches database row)
 */
export const SpiritSchema = z.object({
  id: z.string().uuid(),
  itemNumber: z.number().int().positive(),
  name: z.string().min(1, '名称不能为空').max(200, '名称不能超过 200 个字符'),
  spiritType: SpiritTypeSchema,
  subType: z.string().max(100, '子类型不能超过 100 个字符').nullable().optional(),
  brand: z.string().max(100, '品牌不能超过 100 个字符').nullable().optional(),
  model: z.string().max(100, '型号不能超过 100 个字符').nullable().optional(),
  distillery: z.string().max(200, '酒厂不能超过 200 个字符').nullable().optional(),
  region: z.string().max(100, '产区不能超过 100 个字符').nullable().optional(),
  country: z.string().max(100, '国家不能超过 100 个字符').nullable().optional(),
  vintage: z.number().int().min(1800).max(2100).nullable().optional(),
  age: z.number().int().min(0).max(200).nullable().optional(),
  abv: z.number().min(0).max(100).nullable().optional(),
  volumeMl: z.number().int().min(1).nullable().optional(),
  bottleNumber: z.string().max(100, '瓶号不能超过 100 个字符').nullable().optional(),
  limitedEdition: z.boolean().default(false),
  caskType: z.string().max(100, '桶型不能超过 100 个字符').nullable().optional(),
  bottlingDate: z.coerce.date().nullable().optional(),
  acquiredDate: z.coerce.date().nullable().optional(),
  acquiredFrom: z.string().max(200, '购买渠道不能超过 200 个字符').nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  currentValue: z.number().min(0).nullable().optional(),
  estimatedValue: z.number().min(0).nullable().optional(),
  status: SpiritStatusSchema.default('COLLECTION'),
  bottleStatus: BottleStatusSchema.default('SEALED'),
  storageCondition: z.string().max(500, '储存条件不能超过 500 个字符').nullable().optional(),
  location: z.string().max(200, '位置不能超过 200 个字符').nullable().optional(),
  tastingNotes: z.string().max(2000, '品鉴笔记不能超过 2000 个字符').nullable().optional(),
  notes: z.string().max(1000, '备注不能超过 1000 个字符').nullable().optional(),
  mainImage: z.string().nullable().optional(),
  attachmentImages: z.array(z.string()).nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Spirit = z.infer<typeof SpiritSchema>;

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Schema for creating a new spirit
 */
export const createSpiritSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(200, '名称不能超过 200 个字符'),
  spiritType: SpiritTypeSchema,
  subType: z.string().max(100, '子类型不能超过 100 个字符').nullable().optional(),
  brand: z.string().max(100, '品牌不能超过 100 个字符').nullable().optional(),
  model: z.string().max(100, '型号不能超过 100 个字符').nullable().optional(),
  distillery: z.string().max(200, '酒厂不能超过 200 个字符').nullable().optional(),
  region: z.string().max(100, '产区不能超过 100 个字符').nullable().optional(),
  country: z.string().max(100, '国家不能超过 100 个字符').nullable().optional(),
  vintage: z.number().int().min(1800).max(2100).nullable().optional(),
  age: z.number().int().min(0).max(200).nullable().optional(),
  abv: z.number().min(0).max(100).nullable().optional(),
  volumeMl: z.number().int().min(1).nullable().optional(),
  bottleNumber: z.string().max(100, '瓶号不能超过 100 个字符').nullable().optional(),
  limitedEdition: z.boolean().default(false).optional(),
  caskType: z.string().max(100, '桶型不能超过 100 个字符').nullable().optional(),
  bottlingDate: z.coerce.date().nullable().optional(),
  acquiredDate: z.coerce.date().nullable().optional(),
  acquiredFrom: z.string().max(200, '购买渠道不能超过 200 个字符').nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  currentValue: z.number().min(0).nullable().optional(),
  estimatedValue: z.number().min(0).nullable().optional(),
  status: SpiritStatusSchema.default('COLLECTION').optional(),
  bottleStatus: BottleStatusSchema.default('SEALED').optional(),
  storageCondition: z.string().max(500, '储存条件不能超过 500 个字符').nullable().optional(),
  location: z.string().max(200, '位置不能超过 200 个字符').nullable().optional(),
  tastingNotes: z.string().max(2000, '品鉴笔记不能超过 2000 个字符').nullable().optional(),
  notes: z.string().max(1000, '备注不能超过 1000 个字符').nullable().optional(),
  mainImage: z.string().nullable().optional(),
  attachmentImages: z.array(z.string()).nullable().optional(),
});

export type CreateSpiritInput = z.infer<typeof createSpiritSchema>;

/**
 * Schema for updating an existing spirit
 */
export const updateSpiritSchema = createSpiritSchema.partial();

export type UpdateSpiritInput = z.infer<typeof updateSpiritSchema>;

/**
 * Schema for spirit filters
 */
export const spiritFiltersSchema = z.object({
  spiritType: SpiritTypeSchema.optional(),
  status: SpiritStatusSchema.optional(),
  bottleStatus: BottleStatusSchema.optional(),
  brand: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  limitedEdition: z.boolean().optional(),
  search: z.string().optional(),
});

export type SpiritFiltersInput = z.infer<typeof spiritFiltersSchema>;

/**
 * Schema for spirit search/list queries
 */
export const spiritSearchSchema = z.object({
  filters: spiritFiltersSchema.optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'spiritType', 'vintage', 'age', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(100).optional(),
});

export type SpiritSearchInput = z.infer<typeof spiritSearchSchema>;

// ============================================================================
// Module Adapter Schema
// ============================================================================

/**
 * Spirit attributes (for module registry compatibility)
 */
export const spiritAttributesSchema = SpiritSchema.omit({
  id: true,
  itemNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type SpiritAttributes = z.infer<typeof spiritAttributesSchema>;

/**
 * Extended Spirit type for module registry
 */
export interface SpiritItem extends Spirit {
  type: 'spirit';
}

/**
 * Helper function to convert a Spirit to SpiritItem format
 */
export function spiritToSpiritItem(spirit: Spirit): SpiritItem {
  return {
    ...spirit,
    type: 'spirit',
  };
}

/**
 * Helper function to convert SpiritItem back to Spirit format
 */
export function spiritItemToSpirit(item: SpiritItem): Spirit {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, ...spirit } = item;
  return spirit;
}
