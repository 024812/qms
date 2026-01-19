/**
 * Item CRUD Server Actions
 * 
 * This module provides server-side CRUD operations for items including:
 * - Create, read, update, delete operations
 * - Authentication verification
 * - Module-specific validation using Zod schemas
 * - Automatic usage logging
 * - Cache invalidation using Next.js 16 caching APIs
 * 
 * Next.js 16 Caching Strategy:
 * - Read operations use "use cache" with cacheLife() and cacheTag()
 * - Write operations use updateTag() for fine-grained cache updates
 * - Cache tags: 'items', 'items-{type}', 'items-{id}', 'usage-logs'
 * 
 * Requirements: 3.2, 8.3, 8.4, 9.2
 */

'use server';

import { revalidatePath, unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { updateTag } from 'next/cache';
import { db } from '@/db';
import { items, usageLogs } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';

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
 * Create item input type
 */
type CreateItemInput = {
  type: string;
  name: string;
  attributes: Record<string, any>;
  images?: string[];
  status?: 'in_use' | 'storage' | 'maintenance' | 'lost';
};

/**
 * Update item input type
 */
type UpdateItemInput = {
  name?: string;
  status?: 'in_use' | 'storage' | 'maintenance' | 'lost';
  attributes?: Record<string, any>;
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
 * This function:
 * 1. Verifies user authentication
 * 2. Validates module exists
 * 3. Validates attributes using module's Zod schema
 * 4. Inserts item into database
 * 5. Logs the creation action
 * 6. Invalidates cache tags
 * 
 * Cache invalidation: 'items', 'items-{type}', 'items-list'
 * 
 * Requirements: 9.2 - Next.js 16 cache invalidation
 * 
 * @param data - Item creation data
 * @returns Created item
 * @throws Error if not authenticated or validation fails
 */
export async function createItem(data: CreateItemInput) {
  // Verify authentication (Auth.js v5 best practice)
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Get module configuration
  const module = getModule(data.type);
  if (!module) {
    throw new Error(`Module ${data.type} not found`);
  }

  // Validate attributes using module's Zod schema
  const validationResult = module.attributesSchema.safeParse(data.attributes);
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }

  const validatedAttributes = validationResult.data;

  // Insert into database
  const [item] = await db
    .insert(items)
    .values({
      type: data.type as any,
      name: data.name,
      ownerId: session.user.id,
      attributes: validatedAttributes,
      images: data.images || [],
      status: data.status || 'storage',
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

  // Invalidate cache tags (Next.js 16 best practice - use updateTag in Server Actions)
  updateTag('items');
  updateTag(`items-${data.type}`);
  updateTag('items-list');
  updateTag('usage-logs');
  
  // Revalidate paths for UI updates
  revalidatePath(`/${data.type}`);
  revalidatePath('/');

  return item;
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

  // Build query conditions
  const conditions = [
    eq(items.type, type as any),
    eq(items.ownerId, session.user.id),
  ];

  if (status) {
    conditions.push(eq(items.status, status as any));
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
 * This function:
 * 1. Verifies user authentication
 * 2. Verifies item exists and ownership
 * 3. Validates attributes if provided
 * 4. Updates item in database
 * 5. Logs the update action
 * 6. Invalidates cache tags
 * 
 * Cache invalidation: 'items', 'items-{type}', 'items-{id}', 'items-list', 'usage-logs'
 * 
 * Requirements: 9.2 - Next.js 16 cache invalidation
 * 
 * @param id - Item ID
 * @param data - Update data
 * @returns Updated item
 * @throws Error if not authenticated, item not found, or validation fails
 */
export async function updateItem(id: string, data: UpdateItemInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Get existing item to verify ownership
  const item = await getItemById(id);

  // Validate attributes if provided
  if (data.attributes) {
    const module = getModule(item.type);
    if (!module) {
      throw new Error(`Module ${item.type} not found`);
    }

    const validationResult = module.attributesSchema.safeParse(data.attributes);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }

    data.attributes = validationResult.data;
  }

  // Update item in database
  const [updated] = await db
    .update(items)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(items.id, id))
    .returning();

  // Log the update action
  await db.insert(usageLogs).values({
    itemId: id,
    userId: session.user.id,
    action: 'updated',
    snapshot: {
      name: updated.name,
      status: updated.status,
      changes: Object.keys(data),
    },
  });

  // Invalidate cache tags (Next.js 16 best practice - use updateTag in Server Actions)
  updateTag('items');
  updateTag(`items-${item.type}`);
  updateTag(`items-${id}`);
  updateTag('items-list');
  updateTag('usage-logs');
  
  // Revalidate paths for UI updates
  revalidatePath(`/${item.type}`);
  revalidatePath(`/${item.type}/${id}`);
  revalidatePath('/');

  return updated;
}

/**
 * Delete an item
 * 
 * This function:
 * 1. Verifies user authentication
 * 2. Verifies item exists and ownership
 * 3. Logs the deletion action
 * 4. Deletes item from database
 * 5. Invalidates cache tags
 * 
 * Cache invalidation: 'items', 'items-{type}', 'items-{id}', 'items-list', 'usage-logs'
 * 
 * Requirements: 9.2 - Next.js 16 cache invalidation
 * 
 * @param id - Item ID
 * @throws Error if not authenticated or item not found
 */
export async function deleteItem(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Get item to verify ownership and get type
  const item = await getItemById(id);

  // Log the deletion action before deleting
  await db.insert(usageLogs).values({
    itemId: id,
    userId: session.user.id,
    action: 'deleted',
    snapshot: {
      name: item.name,
      status: item.status,
      type: item.type,
    },
  });

  // Delete item (cascade will delete usage logs)
  await db.delete(items).where(eq(items.id, id));

  // Invalidate cache tags (Next.js 16 best practice - use updateTag in Server Actions)
  updateTag('items');
  updateTag(`items-${item.type}`);
  updateTag(`items-${id}`);
  updateTag('items-list');
  updateTag('usage-logs');
  
  // Revalidate paths for UI updates
  revalidatePath(`/${item.type}`);
  revalidatePath('/');
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
 * This function allows creating custom log entries for specific actions
 * like status changes, usage tracking, etc.
 * 
 * Cache invalidation: 'usage-logs', 'usage-logs-{itemId}', 'usage-logs-user'
 * 
 * Requirements: 6.2, 8.5, 9.2
 * 
 * @param itemId - Item ID
 * @param action - Action description
 * @param snapshot - Optional snapshot data
 * @throws Error if not authenticated or item not found
 */
export async function createUsageLog(
  itemId: string,
  action: string,
  snapshot?: Record<string, any>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to perform this action');
  }

  // Verify item ownership
  await getItemById(itemId);

  // Create usage log
  const [log] = await db
    .insert(usageLogs)
    .values({
      itemId,
      userId: session.user.id,
      action,
      snapshot: snapshot || {},
    })
    .returning();

  // Invalidate cache tags
  updateTag('usage-logs');
  updateTag(`usage-logs-${itemId}`);
  updateTag('usage-logs-user');

  return log;
}
