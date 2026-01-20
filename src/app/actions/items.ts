/**
 * Item CRUD Server Actions
 *
 * This module provides server-side CRUD operations for items following Next.js 16 best practices:
 * - Validate input FIRST using Zod schemas
 * - Check authentication SECOND
 * - Return structured responses (never throw errors)
 * - Use FormData as input for useActionState compatibility
 * - Automatic usage logging
 * - Cache invalidation using Next.js 16 caching APIs
 *
 * Next.js 16 Best Practices Pattern:
 * 1. Validate input with Zod (return errors if invalid)
 * 2. Check authentication (return error if not authenticated)
 * 3. Perform database operations (wrapped in try-catch)
 * 4. Invalidate cache tags
 * 5. Return structured response { success, data, error, errors }
 *
 * Next.js 16 Caching Strategy:
 * - Read operations use "use cache" with cacheLife() and cacheTag()
 * - Write operations use updateTag() for fine-grained cache updates
 * - Cache tags: 'items', 'items-{type}', 'items-{id}', 'usage-logs'
 *
 * Reference: https://nextjs.org/docs/app/guides/forms
 * Reference: https://nextjs.org/docs/app/guides/authentication
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 4.1-4.5, 7.1-7.4, 8.1-8.5, 9.1-9.5
 */

'use server';

/**
 * Map module ID to database type
 * Module IDs are plural (quilts, cards) but database types are singular (quilt, card)
 */
function moduleIdToDbType(moduleId: string): 'quilt' | 'card' | 'shoe' | 'racket' {
  const mapping: Record<string, 'quilt' | 'card' | 'shoe' | 'racket'> = {
    quilts: 'quilt',
    cards: 'card',
    shoes: 'shoe',
    rackets: 'racket',
  };
  return mapping[moduleId] || (moduleId as 'quilt' | 'card' | 'shoe' | 'racket');
}

import {
  revalidatePath,
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  updateTag,
} from 'next/cache';

import { db } from '@/db';
import { items, usageLogs, cards } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';
import {
  createItemSchema,
  updateItemSchema,
  deleteItemSchema,
  createUsageLogSchema,
} from '@/lib/validations/items';
import type {
  CreateItemFormState,
  UpdateItemFormState,
  DeleteItemFormState,
  CreateUsageLogFormState,
} from './types';

/**
 * Paginated result type
 */
type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Create item input type (internal use only - prefixed with _ to indicate unused)
 */
type _CreateItemInput = {
  type: string;
  name: string;
  attributes: Record<string, unknown>;
  images?: string[];
  status?: 'in_use' | 'storage' | 'maintenance' | 'lost';
};

/**
 * Update item input type (internal use only - prefixed with _ to indicate unused)
 */
type _UpdateItemInput = {
  name?: string;
  status?: 'in_use' | 'storage' | 'maintenance' | 'lost';
  attributes?: Record<string, unknown>;
  images?: string[];
};

/**
 * Get items options type
 */
type GetItemsOptions = {
  page?: number;
  pageSize?: number;
  status?: string;
};

/**
 * Create a new item
 *
 * Following Next.js 16 best practices from Context7 documentation:
 * 1. VALIDATE INPUT FIRST using Zod schema
 * 2. CHECK AUTHENTICATION SECOND
 * 3. Perform database operations (wrapped in try-catch)
 * 4. Invalidate cache tags
 * 5. Return structured response (never throw errors)
 *
 * Pattern: validate → authenticate → database → cache → return
 *
 * Cache invalidation: 'items', 'items-{type}', 'items-list', 'usage-logs'
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1-3.6, 7.1-7.4, 8.1-8.3, 9.1-9.5
 *
 * @param prevState - Previous form state (from useActionState)
 * @param formData - Form data from form submission
 * @returns Structured response with success/error/errors
 */
export async function createItem(
  prevState: CreateItemFormState | undefined,
  formData: FormData
): Promise<CreateItemFormState> {
  // 1. VALIDATE INPUT FIRST (Next.js 16 best practice)
  // Parse FormData fields - attributes and images come as JSON strings
  const validatedFields = createItemSchema.safeParse({
    type: formData.get('type'),
    name: formData.get('name'),
    attributes: formData.get('attributes') ? JSON.parse(formData.get('attributes') as string) : {},
    images: formData.get('images') ? JSON.parse(formData.get('images') as string) : [],
    status: formData.get('status') || 'storage',
  });

  // Return early if validation fails (don't proceed to auth)
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. CHECK AUTHENTICATION SECOND (after validation)
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' };
  }

  // 3. DATABASE OPERATIONS (wrapped in try-catch)
  try {
    // Get module configuration
    const moduleConfig = getModule(validatedFields.data.type);
    if (!moduleConfig) {
      return { error: `Module ${validatedFields.data.type} not found` };
    }

    // Validate attributes using module's Zod schema
    const moduleValidation = moduleConfig.attributesSchema.safeParse(
      validatedFields.data.attributes
    );
    if (!moduleValidation.success) {
      return {
        errors: {
          attributes: moduleValidation.error.issues.map(
            err => `${err.path.join('.')}: ${err.message}`
          ),
        },
      };
    }

    // Map module ID to database type
    const dbType = moduleIdToDbType(validatedFields.data.type);

    // Insert into database
    const [item] = await db
      .insert(items)
      .values({
        type: dbType,
        name: validatedFields.data.name,
        ownerId: session.user.id,
        attributes: moduleValidation.data,
        images: validatedFields.data.images,
        status: validatedFields.data.status,
      })
      .returning();

    // Log the creation action
    await db.insert(usageLogs).values({
      itemId: item.id,
      userId: session.user.id,
      action: 'created',
      snapshot: {
        name: item.name,
        status: item.status,
        type: item.type,
      },
    });

    // 4. CACHE INVALIDATION (Next.js 16 best practice)
    updateTag('items');
    updateTag(`items-${validatedFields.data.type}`);
    updateTag('items-list');
    updateTag('usage-logs');

    // Revalidate paths for UI updates
    revalidatePath(`/${validatedFields.data.type}`);
    revalidatePath('/');

    // 5. RETURN SUCCESS (structured response)
    return {
      success: true,
      data: item,
    };
  } catch (error) {
    // Return user-friendly error (don't expose internal details)
    console.error('Failed to create item:', error);
    return { error: 'Failed to create item. Please try again.' };
  }
}

/**
 * Get items list with pagination and filtering
 *
 * This function:
 * 1. Verifies user authentication
 * 2. Queries items with filters
 * 3. Implements pagination
 * 4. Returns paginated results
 *
 * Caching: 2 minutes (list data, frequent updates)
 * Cache tags: 'items', 'items-{type}', 'items-list'
 *
 * Requirements: 9.2 - Next.js 16 caching
 *
 * @param type - Module type
 * @param options - Query options (page, pageSize, status)
 * @returns Paginated items result
 * @throws Error if not authenticated
 */
export async function getItems(
  type: string,
  options?: GetItemsOptions
): Promise<PaginatedResult<typeof items.$inferSelect>> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('items', `items-${type}`, 'items-list');

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const { page = 1, pageSize = 20, status } = options || {};
  const offset = (page - 1) * pageSize;

  // For cards module, use the cards table directly
  if (type === 'cards') {
    // Query cards table
    const results = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, session.user.id))
      .orderBy(desc(cards.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Count total cards
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(cards)
      .where(eq(cards.userId, session.user.id));

    // Transform cards to match items interface
    const transformedResults = results.map(card => ({
      id: card.id,
      type: 'card' as const,
      name: `${card.playerName} - ${card.year} ${card.brand}`,
      status: 'storage' as const, // Default status
      ownerId: card.userId,
      attributes: {
        playerName: card.playerName,
        sport: card.sport,
        team: card.team,
        position: card.position,
        year: card.year,
        brand: card.brand,
        series: card.series,
        cardNumber: card.cardNumber,
        gradingCompany: card.gradingCompany,
        grade: card.grade,
        certificationNumber: card.certificationNumber,
        purchasePrice: card.purchasePrice,
        purchaseDate: card.purchaseDate,
        currentValue: card.currentValue,
        estimatedValue: card.estimatedValue,
        parallel: card.parallel,
        serialNumber: card.serialNumber,
        isAutographed: card.isAutographed,
        hasMemorabilia: card.hasMemorabilia,
        memorabiliaType: card.memorabiliaType,
        status: card.status,
        location: card.location,
        storageType: card.storageType,
        condition: card.condition,
        notes: card.notes,
      },
      images: [card.mainImage, ...(card.attachmentImages || [])].filter(Boolean) as string[],
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    }));

    return {
      data: transformedResults as any,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  // For other modules, use items table
  // Map module ID to database type
  const dbType = moduleIdToDbType(type);

  // Build query conditions
  const conditions = [eq(items.type, dbType), eq(items.ownerId, session.user.id)];

  if (status) {
    conditions.push(eq(items.status, status as 'in_use' | 'storage' | 'maintenance' | 'lost'));
  }

  // Query items
  const results = await db
    .select()
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(items.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Count total items
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(items)
    .where(and(...conditions));

  return {
    data: results,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

/**
 * Get a single item by ID
 *
 * This function:
 * 1. Verifies user authentication
 * 2. Queries item by ID
 * 3. Verifies ownership
 * 4. Returns item
 *
 * Caching: 5 minutes (individual items accessed frequently)
 * Cache tags: 'items', 'items-{id}'
 *
 * Requirements: 9.2 - Next.js 16 caching
 *
 * @param id - Item ID
 * @returns Item
 * @throws Error if not authenticated or item not found
 */
export async function getItemById(id: string) {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('items', `items-${id}`);

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.ownerId, session.user.id)))
    .limit(1);

  if (!item) {
    throw new Error('Item not found');
  }

  return item;
}

/**
 * Update an item
 *
 * Following Next.js 16 best practices from Context7 documentation:
 * 1. VALIDATE INPUT FIRST using Zod schema
 * 2. CHECK AUTHENTICATION SECOND
 * 3. Verify item exists and ownership
 * 4. Perform database operations (wrapped in try-catch)
 * 5. Invalidate cache tags
 * 6. Return structured response (never throw errors)
 *
 * Pattern: validate → authenticate → verify → database → cache → return
 *
 * Cache invalidation: 'items', 'items-{type}', 'items-{id}', 'items-list', 'usage-logs'
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 7.1-7.4, 8.1-8.3, 9.1-9.5
 *
 * @param prevState - Previous form state (from useActionState)
 * @param formData - Form data from form submission
 * @returns Structured response with success/error/errors
 */
export async function updateItem(
  prevState: UpdateItemFormState | undefined,
  formData: FormData
): Promise<UpdateItemFormState> {
  // 1. VALIDATE INPUT FIRST (Next.js 16 best practice)
  const validatedFields = updateItemSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    status: formData.get('status'),
    attributes: formData.get('attributes')
      ? JSON.parse(formData.get('attributes') as string)
      : undefined,
    images: formData.get('images') ? JSON.parse(formData.get('images') as string) : undefined,
  });

  // Return early if validation fails
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. CHECK AUTHENTICATION SECOND (after validation)
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' };
  }

  // 3. DATABASE OPERATIONS (wrapped in try-catch)
  try {
    // Verify item exists and ownership
    const [existingItem] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, validatedFields.data.id), eq(items.ownerId, session.user.id)))
      .limit(1);

    if (!existingItem) {
      return { error: 'Item not found' };
    }

    // Prepare update data
    const updateData: {
      updatedAt: Date;
      name?: string;
      status?: 'in_use' | 'storage' | 'maintenance' | 'lost';
      images?: string[];
      attributes?: Record<string, unknown>;
    } = {
      updatedAt: new Date(),
    };

    if (validatedFields.data.name !== undefined) {
      updateData.name = validatedFields.data.name;
    }
    if (validatedFields.data.status !== undefined) {
      updateData.status = validatedFields.data.status;
    }
    if (validatedFields.data.images !== undefined) {
      updateData.images = validatedFields.data.images;
    }

    // Validate attributes if provided
    if (validatedFields.data.attributes !== undefined) {
      const moduleConfig = getModule(existingItem.type);
      if (!moduleConfig) {
        return { error: `Module ${existingItem.type} not found` };
      }

      const moduleValidation = moduleConfig.attributesSchema.safeParse(
        validatedFields.data.attributes
      );
      if (!moduleValidation.success) {
        return {
          errors: {
            attributes: moduleValidation.error.issues.map(
              err => `${err.path.join('.')}: ${err.message}`
            ),
          },
        };
      }

      updateData.attributes = moduleValidation.data;
    }

    // Update item in database
    const [updated] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, validatedFields.data.id))
      .returning();

    // Log the update action
    await db.insert(usageLogs).values({
      itemId: validatedFields.data.id,
      userId: session.user.id,
      action: 'updated',
      snapshot: {
        name: updated.name,
        status: updated.status,
        changes: Object.keys(validatedFields.data).filter(k => k !== 'id'),
      },
    });

    // 4. CACHE INVALIDATION (Next.js 16 best practice)
    updateTag('items');
    updateTag(`items-${existingItem.type}`);
    updateTag(`items-${validatedFields.data.id}`);
    updateTag('items-list');
    updateTag('usage-logs');

    // Revalidate paths for UI updates
    revalidatePath(`/${existingItem.type}`);
    revalidatePath(`/${existingItem.type}/${validatedFields.data.id}`);
    revalidatePath('/');

    // 5. RETURN SUCCESS (structured response)
    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    // Return user-friendly error (don't expose internal details)
    console.error('Failed to update item:', error);
    return { error: 'Failed to update item. Please try again.' };
  }
}

/**
 * Delete an item
 *
 * Following Next.js 16 best practices from Context7 documentation:
 * 1. VALIDATE INPUT FIRST using Zod schema
 * 2. CHECK AUTHENTICATION SECOND
 * 3. Verify item exists and ownership
 * 4. Log deletion before deleting
 * 5. Perform database operations (wrapped in try-catch)
 * 6. Invalidate cache tags
 * 7. Return structured response (never throw errors)
 *
 * Pattern: validate → authenticate → verify → log → database → cache → return
 *
 * Cache invalidation: 'items', 'items-{type}', 'items-{id}', 'items-list', 'usage-logs'
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 7.1-7.4, 8.1-8.2, 9.1-9.5
 *
 * @param prevState - Previous form state (from useActionState)
 * @param formData - Form data from form submission
 * @returns Structured response with success/error/errors
 */
export async function deleteItem(
  prevState: DeleteItemFormState | undefined,
  formData: FormData
): Promise<DeleteItemFormState> {
  // 1. VALIDATE INPUT FIRST (Next.js 16 best practice)
  const validatedFields = deleteItemSchema.safeParse({
    id: formData.get('id'),
  });

  // Return early if validation fails
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. CHECK AUTHENTICATION SECOND (after validation)
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' };
  }

  // 3. DATABASE OPERATIONS (wrapped in try-catch)
  try {
    // Verify item exists and ownership
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, validatedFields.data.id), eq(items.ownerId, session.user.id)))
      .limit(1);

    if (!item) {
      return { error: 'Item not found' };
    }

    // Log the deletion action BEFORE deleting
    await db.insert(usageLogs).values({
      itemId: validatedFields.data.id,
      userId: session.user.id,
      action: 'deleted',
      snapshot: {
        name: item.name,
        status: item.status,
        type: item.type,
      },
    });

    // Delete item (cascade will delete usage logs)
    await db.delete(items).where(eq(items.id, validatedFields.data.id));

    // 4. CACHE INVALIDATION (Next.js 16 best practice)
    updateTag('items');
    updateTag(`items-${item.type}`);
    updateTag(`items-${validatedFields.data.id}`);
    updateTag('items-list');
    updateTag('usage-logs');

    // Revalidate paths for UI updates
    revalidatePath(`/${item.type}`);
    revalidatePath('/');

    // 5. RETURN SUCCESS (structured response)
    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    // Return user-friendly error (don't expose internal details)
    console.error('Failed to delete item:', error);
    return { error: 'Failed to delete item. Please try again.' };
  }
}

/**
 * Get usage logs for an item
 *
 * This function:
 * 1. Verifies user authentication
 * 2. Verifies item exists and ownership
 * 3. Queries usage logs
 * 4. Returns logs ordered by creation date
 *
 * Caching: 1 minute (logs change frequently)
 * Cache tags: 'usage-logs', 'usage-logs-{itemId}'
 *
 * Requirements: 6.2, 8.5, 9.2
 *
 * @param itemId - Item ID
 * @returns Usage logs
 * @throws Error if not authenticated or item not found
 */
export async function getUsageLogs(itemId: string) {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('usage-logs', `usage-logs-${itemId}`);

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Verify item ownership
  await getItemById(itemId);

  // Query usage logs
  const logs = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.itemId, itemId))
    .orderBy(desc(usageLogs.createdAt));

  return logs;
}

/**
 * Get all usage logs for the current user
 *
 * This function:
 * 1. Verifies user authentication
 * 2. Queries all usage logs for user's items
 * 3. Returns logs with pagination
 *
 * Caching: 1 minute (logs change frequently)
 * Cache tags: 'usage-logs', 'usage-logs-user'
 *
 * Requirements: 6.2, 8.5, 9.2
 *
 * @param options - Query options (page, pageSize)
 * @returns Paginated usage logs
 * @throws Error if not authenticated
 */
export async function getUserUsageLogs(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<typeof usageLogs.$inferSelect>> {
  'use cache';
  cacheLife('seconds'); // 1 minute (60 seconds)
  cacheTag('usage-logs', 'usage-logs-user');

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  const { page = 1, pageSize = 50 } = options || {};
  const offset = (page - 1) * pageSize;

  // Query usage logs for user
  const logs = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.userId, session.user.id))
    .orderBy(desc(usageLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Count total logs
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(usageLogs)
    .where(eq(usageLogs.userId, session.user.id));

  return {
    data: logs,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };
}

/**
 * Create a custom usage log entry
 *
 * Following Next.js 16 best practices from Context7 documentation:
 * 1. VALIDATE INPUT FIRST using Zod schema
 * 2. CHECK AUTHENTICATION SECOND
 * 3. Verify item exists and ownership
 * 4. Perform database operations (wrapped in try-catch)
 * 5. Invalidate cache tags
 * 6. Return structured response (never throw errors)
 *
 * Pattern: validate → authenticate → verify → database → cache → return
 *
 * Cache invalidation: 'usage-logs', 'usage-logs-{itemId}', 'usage-logs-user'
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 7.1-7.2, 9.1-9.5
 *
 * @param prevState - Previous form state (from useActionState)
 * @param formData - Form data from form submission
 * @returns Structured response with success/error/errors
 */
export async function createUsageLog(
  prevState: CreateUsageLogFormState | undefined,
  formData: FormData
): Promise<CreateUsageLogFormState> {
  // 1. VALIDATE INPUT FIRST (Next.js 16 best practice)
  const validatedFields = createUsageLogSchema.safeParse({
    itemId: formData.get('itemId'),
    action: formData.get('action'),
    snapshot: formData.get('snapshot') ? JSON.parse(formData.get('snapshot') as string) : {},
  });

  // Return early if validation fails
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. CHECK AUTHENTICATION SECOND (after validation)
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required' };
  }

  // 3. DATABASE OPERATIONS (wrapped in try-catch)
  try {
    // Verify item exists and ownership
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, validatedFields.data.itemId), eq(items.ownerId, session.user.id)))
      .limit(1);

    if (!item) {
      return { error: 'Item not found' };
    }

    // Create usage log
    const [log] = await db
      .insert(usageLogs)
      .values({
        itemId: validatedFields.data.itemId,
        userId: session.user.id,
        action: validatedFields.data.action,
        snapshot: validatedFields.data.snapshot,
      })
      .returning();

    // 4. CACHE INVALIDATION (Next.js 16 best practice)
    updateTag('usage-logs');
    updateTag(`usage-logs-${validatedFields.data.itemId}`);
    updateTag('usage-logs-user');

    // 5. RETURN SUCCESS (structured response)
    return {
      success: true,
      data: log,
    };
  } catch (error) {
    // Return user-friendly error (don't expose internal details)
    console.error('Failed to create usage log:', error);
    return { error: 'Failed to create usage log. Please try again.' };
  }
}
