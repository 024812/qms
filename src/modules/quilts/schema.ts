/**
 * Quilt Module Schema
 * 
 * Defines the attributes schema for the quilt module.
 * 
 * Requirements: 2.2, 5.2
 */

import { z } from 'zod';
import { Item } from '@/db/schema';

/**
 * Quilt module attributes schema
 */
export const quiltAttributesSchema = z.object({
  brand: z.string().optional(),
  size: z.enum(['single', 'double', 'queen', 'king']),
  material: z.string(),
  weight: z.number().positive().optional(),
  warmthLevel: z.number().int().min(1).max(5), // 1-5 warmth levels
  season: z.enum(['spring', 'summer', 'autumn', 'winter', 'all_season']),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor']).default('good'),
  notes: z.string().optional(),
});

export type QuiltAttributes = z.infer<typeof quiltAttributesSchema>;

/**
 * Complete quilt type (base fields + specific fields)
 */
export type Quilt = Omit<Item, 'attributes'> & {
  type: 'quilt';
  attributes: QuiltAttributes;
};
