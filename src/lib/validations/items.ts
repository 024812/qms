/**
 * Zod Validation Schemas for Item Operations
 *
 * These schemas validate form data in Server Actions following Next.js 16 best practices.
 * All schemas include user-friendly error messages and proper type constraints.
 *
 * Pattern from Context7 Next.js 16 documentation:
 * - Use z.string().min() with custom error messages
 * - Use .trim() to clean input
 * - Use .optional() for optional fields with .default() for defaults
 * - Use safeParse() in Server Actions to validate
 * - Return errors using error.flatten().fieldErrors
 *
 * Reference: https://nextjs.org/docs/app/guides/forms
 * Reference: https://nextjs.org/docs/app/guides/authentication
 */

import { z } from 'zod';

/**
 * Schema for createItem Server Action
 *
 * Validates all required fields for creating a new item.
 * Used with FormData from forms, so all fields come as strings initially.
 */
export const createItemSchema = z.object({
  type: z.string().min(1, { message: 'Item type is required' }).trim(),

  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must be less than 255 characters' })
    .trim(),

  attributes: z.record(z.string(), z.unknown()).default({}),

  images: z.array(z.url('Invalid image URL')).optional().default([]),

  status: z.enum(['in_use', 'storage', 'maintenance', 'lost']).optional().default('storage'),
});

/**
 * Schema for updateItem Server Action
 *
 * All fields are optional since this is a partial update.
 * The id field is required to identify which item to update.
 */
export const updateItemSchema = z.object({
  id: z.string().min(1, { message: 'Item ID is required' }).trim(),

  name: z
    .string()
    .min(1, { message: 'Name cannot be empty' })
    .max(255, { message: 'Name must be less than 255 characters' })
    .trim()
    .optional(),

  status: z.enum(['in_use', 'storage', 'maintenance', 'lost']).optional(),

  attributes: z.record(z.string(), z.unknown()).optional(),

  images: z.array(z.url('Invalid image URL')).optional(),
});

/**
 * Schema for deleteItem Server Action
 *
 * Only requires the item ID to identify which item to delete.
 */
export const deleteItemSchema = z.object({
  id: z.string().min(1, { message: 'Item ID is required' }).trim(),
});

/**
 * Schema for createUsageLog Server Action
 *
 * Validates fields for creating a usage log entry.
 */
export const createUsageLogSchema = z.object({
  itemId: z.string().min(1, { message: 'Item ID is required' }).trim(),

  action: z
    .string()
    .min(1, { message: 'Action is required' })
    .max(255, { message: 'Action must be less than 255 characters' })
    .trim(),

  snapshot: z.record(z.string(), z.unknown()).optional().default({}),
});

/**
 * Type inference helpers
 *
 * These types can be used to get TypeScript types from the Zod schemas.
 */
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type DeleteItemInput = z.infer<typeof deleteItemSchema>;
export type CreateUsageLogInput = z.infer<typeof createUsageLogSchema>;
