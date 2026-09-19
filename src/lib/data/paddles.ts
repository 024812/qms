/**
 * Paddles Data Access Layer
 *
 * Functional data access layer following Next.js 16 best practices.
 *
 * Architecture:
 * - Standalone async functions (not classes)
 * - 'use cache' directive for persistent caching
 * - Serializable data only (no class instances, no undefined)
 * - Cache invalidation with revalidateTag(, 'max')
 *
 * Cache Strategy:
 * - Individual items: `moduleItem` profile (revalidate 5 minutes)
 * - Lists: `moduleList` profile (revalidate 2 minutes)
 * - Tags: 'paddles', 'paddles:item:{id}', 'paddles:status:{status}'
 */

import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { db } from '@/db';
import { paddles } from '@/db/schema';
import { eq, sql, desc, and, asc } from 'drizzle-orm';
import { dbLogger } from '@/lib/logger';
import { RecordNotFoundError } from '@/lib/data/errors';
import { searchAnyColumn } from '@/lib/data/search';
import { paddlesCacheTags } from '@/modules/core/cache-tags';
import type { PaddleItem, PaddleSortField, PaddleStatus } from '@/modules/paddles/schema';
import { rowToPaddleItem } from '@/modules/paddles/schema';

// ============================================================================
// Types
// ============================================================================

// Sortable columns come from the module's const tuple, so the Zod enum used by the
// action/API layer and this type cannot drift apart.
export type { PaddleSortField };

export type SortOrder = 'asc' | 'desc';

export interface PaddleFilters {
  status?: PaddleStatus;
  bladeBrand?: string;
  handleType?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: PaddleSortField;
  sortOrder?: SortOrder;
}

export interface CreatePaddleData {
  name: string;
  bladeBrand?: string | null;
  bladeModel?: string | null;
  bladeWeightG?: number | null;
  thicknessMm?: number | null;
  handleType?: string | null;
  forehandRubber?: string | null;
  backhandRubber?: string | null;
  rubberThicknessMm?: number | null;
  bladeSpeed?: number | null;
  bladeControl?: number | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  acquiredFrom?: string | null;
  currentValue?: number | null;
  soldPrice?: number | null;
  soldDate?: Date | null;
  status?: PaddleStatus;
  condition?: string | null;
  location?: string | null;
  notes?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
}

export type UpdatePaddleData = Partial<CreatePaddleData> & {
  id: string;
};

type PaddleMutationValues = Partial<typeof paddles.$inferInsert>;

function logPaddleDataError(message: string, error: unknown, meta?: Record<string, unknown>) {
  if (error instanceof Error) {
    dbLogger.error(message, error, meta);
    return;
  }

  dbLogger.error(message, undefined, {
    ...meta,
    ...(error !== undefined ? { error } : {}),
  });
}

function buildPaddleUpdateValues(data: Partial<CreatePaddleData>): PaddleMutationValues {
  const updateValues: PaddleMutationValues = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateValues.name = data.name;
  if (data.bladeBrand !== undefined) updateValues.bladeBrand = data.bladeBrand;
  if (data.bladeModel !== undefined) updateValues.bladeModel = data.bladeModel;
  if (data.bladeWeightG !== undefined)
    updateValues.bladeWeightG = data.bladeWeightG !== null ? data.bladeWeightG.toString() : null;
  if (data.thicknessMm !== undefined)
    updateValues.thicknessMm = data.thicknessMm !== null ? data.thicknessMm.toString() : null;
  if (data.handleType !== undefined) updateValues.handleType = data.handleType;
  if (data.forehandRubber !== undefined) updateValues.forehandRubber = data.forehandRubber;
  if (data.backhandRubber !== undefined) updateValues.backhandRubber = data.backhandRubber;
  if (data.rubberThicknessMm !== undefined)
    updateValues.rubberThicknessMm = data.rubberThicknessMm?.toString() || null;
  if (data.bladeSpeed !== undefined) updateValues.bladeSpeed = data.bladeSpeed;
  if (data.bladeControl !== undefined) updateValues.bladeControl = data.bladeControl;
  if (data.purchaseDate !== undefined)
    updateValues.purchaseDate = data.purchaseDate
      ? data.purchaseDate.toISOString().split('T')[0]
      : null;
  if (data.purchasePrice !== undefined)
    updateValues.purchasePrice = data.purchasePrice?.toString() || null;
  if (data.acquiredFrom !== undefined) updateValues.acquiredFrom = data.acquiredFrom;
  if (data.currentValue !== undefined)
    updateValues.currentValue = data.currentValue?.toString() || null;
  if (data.soldPrice !== undefined) updateValues.soldPrice = data.soldPrice?.toString() || null;
  if (data.soldDate !== undefined)
    updateValues.soldDate = data.soldDate ? data.soldDate.toISOString().split('T')[0] : null;
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.condition !== undefined) updateValues.condition = data.condition;
  if (data.location !== undefined) updateValues.location = data.location;
  if (data.notes !== undefined) updateValues.notes = data.notes;
  if (data.mainImage !== undefined) updateValues.mainImage = data.mainImage;
  if (data.attachmentImages !== undefined) updateValues.attachmentImages = data.attachmentImages;

  return updateValues;
}

// ============================================================================
// READ OPERATIONS (with caching)
// ============================================================================

/**
 * Get paddle by ID
 *
 * Cache: `moduleItem` profile (revalidate 5 minutes)
 * Tags: 'paddles', 'paddles:item:{id}'
 */
export async function getPaddleById(id: string): Promise<PaddleItem | null> {
  'use cache';
  cacheLife('moduleItem');
  cacheTag(paddlesCacheTags.root, paddlesCacheTags.item(id));

  try {
    const result = await db.select().from(paddles).where(eq(paddles.id, id));
    return result[0] ? rowToPaddleItem(result[0]) : null;
  } catch (error) {
    logPaddleDataError('Error fetching paddle by ID', error, { id });
    throw error;
  }
}

/**
 * Get all paddles with optional filters
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 * Tags: 'paddles', 'paddles:list', optional status slices
 */
export async function getPaddles(filters?: PaddleFilters): Promise<PaddleItem[]> {
  'use cache';
  cacheLife('moduleList');

  const tags = [paddlesCacheTags.root, paddlesCacheTags.list];
  if (filters?.status) {
    tags.push(paddlesCacheTags.slice('status', filters.status));
  }
  cacheTag(...tags);

  try {
    let query = db.select().from(paddles);

    // Build WHERE conditions
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(paddles.status, filters.status));
    }

    if (filters?.bladeBrand) {
      conditions.push(eq(paddles.bladeBrand, filters.bladeBrand));
    }

    if (filters?.handleType) {
      conditions.push(eq(paddles.handleType, filters.handleType));
    }

    const searchCondition = searchAnyColumn(
      [
        paddles.name,
        paddles.bladeBrand,
        paddles.bladeModel,
        paddles.forehandRubber,
        paddles.backhandRubber,
      ],
      filters?.search
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Apply sorting
    const sortField = filters?.sortBy || 'itemNumber';
    const sortOrder = filters?.sortOrder || 'asc';
    const orderFn = sortOrder === 'desc' ? desc : asc;

    switch (sortField) {
      case 'itemNumber':
        query = query.orderBy(orderFn(paddles.itemNumber)) as typeof query;
        break;
      case 'name':
        query = query.orderBy(orderFn(paddles.name)) as typeof query;
        break;
      case 'bladeBrand':
        query = query.orderBy(orderFn(paddles.bladeBrand)) as typeof query;
        break;
      case 'bladeWeightG':
        query = query.orderBy(orderFn(paddles.bladeWeightG)) as typeof query;
        break;
      case 'createdAt':
        query = query.orderBy(orderFn(paddles.createdAt)) as typeof query;
        break;
      case 'updatedAt':
        query = query.orderBy(orderFn(paddles.updatedAt)) as typeof query;
        break;
      default:
        query = query.orderBy(orderFn(paddles.itemNumber)) as typeof query;
    }

    // Apply pagination
    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as typeof query;
    }

    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as typeof query;
    }

    const results = await query;
    return results.map(rowToPaddleItem);
  } catch (error) {
    logPaddleDataError('Error fetching paddles', error, { filters });
    throw error;
  }
}

/**
 * Count paddles with optional filters
 *
 * Cache: `moduleList` profile (revalidate 2 minutes)
 */
export async function countPaddles(
  filters?: Omit<PaddleFilters, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
): Promise<number> {
  'use cache';
  cacheLife('moduleList');
  cacheTag(paddlesCacheTags.root, paddlesCacheTags.list);

  try {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(paddles.status, filters.status));
    }

    if (filters?.bladeBrand) {
      conditions.push(eq(paddles.bladeBrand, filters.bladeBrand));
    }

    if (filters?.handleType) {
      conditions.push(eq(paddles.handleType, filters.handleType));
    }

    const searchCondition = searchAnyColumn(
      [
        paddles.name,
        paddles.bladeBrand,
        paddles.bladeModel,
        paddles.forehandRubber,
        paddles.backhandRubber,
      ],
      filters?.search
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }

    let query = db.select({ count: sql<number>`count(*)` }).from(paddles);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query;
    return Number(result[0].count);
  } catch (error) {
    logPaddleDataError('Error counting paddles', error, { filters });
    throw error;
  }
}

// ============================================================================
// WRITE OPERATIONS (with cache invalidation)
// ============================================================================

/**
 * Create a new paddle
 */
export async function createPaddle(data: CreatePaddleData): Promise<PaddleItem> {
  try {
    const insertData: typeof paddles.$inferInsert = {
      name: data.name,
      bladeBrand: data.bladeBrand ?? null,
      bladeModel: data.bladeModel ?? null,
      bladeWeightG:
        data.bladeWeightG !== undefined && data.bladeWeightG !== null
          ? data.bladeWeightG.toString()
          : null,
      thicknessMm:
        data.thicknessMm !== undefined && data.thicknessMm !== null
          ? data.thicknessMm.toString()
          : null,
      handleType: data.handleType ?? null,
      forehandRubber: data.forehandRubber ?? null,
      backhandRubber: data.backhandRubber ?? null,
      rubberThicknessMm: data.rubberThicknessMm?.toString() || null,
      bladeSpeed: data.bladeSpeed ?? null,
      bladeControl: data.bladeControl ?? null,
      purchaseDate: data.purchaseDate ? data.purchaseDate.toISOString().split('T')[0] : null,
      purchasePrice: data.purchasePrice?.toString() || null,
      acquiredFrom: data.acquiredFrom ?? null,
      currentValue: data.currentValue?.toString() || null,
      soldPrice: data.soldPrice?.toString() || null,
      soldDate: data.soldDate ? data.soldDate.toISOString().split('T')[0] : null,
      status: data.status || 'ACTIVE',
      condition: data.condition ?? null,
      location: data.location ?? null,
      notes: data.notes ?? null,
      mainImage: data.mainImage ?? null,
      attachmentImages: data.attachmentImages ?? null,
    };

    const result = await db.insert(paddles).values(insertData).returning();

    if (!result[0]) {
      throw new Error('Failed to create paddle');
    }

    const paddle = rowToPaddleItem(result[0]);

    // Invalidate cache
    revalidateTag(paddlesCacheTags.root, 'max');
    revalidateTag(paddlesCacheTags.list, 'max');
    if (paddle.status) {
      revalidateTag(paddlesCacheTags.slice('status', paddle.status), 'max');
    }

    return paddle;
  } catch (error) {
    logPaddleDataError('Error creating paddle', error, { data });
    throw error;
  }
}

/**
 * Invalidate every cache tag affected by a paddle write.
 *
 * Contract: call only AFTER the surrounding transaction has committed —
 * `revalidateTag` does not participate in rollback.
 */
function invalidatePaddleWriteTags(input: {
  id: string;
  statuses: Array<PaddleStatus | null | undefined>;
}) {
  revalidateTag(paddlesCacheTags.root, 'max');
  revalidateTag(paddlesCacheTags.list, 'max');
  revalidateTag(paddlesCacheTags.item(input.id), 'max');

  for (const status of input.statuses) {
    if (status) {
      revalidateTag(paddlesCacheTags.slice('status', status), 'max');
    }
  }
}

/**
 * Update an existing paddle.
 *
 * The read-modify-write runs inside a transaction holding a `SELECT ... FOR
 * UPDATE` row lock. The pre-read status decides which cache slices are
 * invalidated, so without the lock two concurrent writes could both observe the
 * old status and leave a slice stale.
 *
 * @throws {RecordNotFoundError} when the paddle does not exist.
 */
export async function updatePaddle(
  id: string,
  data: Partial<CreatePaddleData>
): Promise<PaddleItem> {
  try {
    const { previous, updated } = await db.transaction(async tx => {
      const [locked] = await tx
        .select()
        .from(paddles)
        .where(eq(paddles.id, id))
        .limit(1)
        .for('update');

      if (!locked) {
        throw new RecordNotFoundError('Paddle', id);
      }

      const updateValues = buildPaddleUpdateValues(data);

      const rows = await tx.update(paddles).set(updateValues).where(eq(paddles.id, id)).returning();

      if (!rows[0]) {
        throw new RecordNotFoundError('Paddle', id);
      }

      return { previous: rowToPaddleItem(locked), updated: rowToPaddleItem(rows[0]) };
    });

    invalidatePaddleWriteTags({ id, statuses: [previous.status, updated.status] });

    return updated;
  } catch (error) {
    logPaddleDataError('Error updating paddle', error, { id, data });
    throw error;
  }
}

/**
 * Delete a paddle.
 *
 * @returns `true` when a row was deleted, `false` when it did not exist. This
 * matches `deleteQuilt`: a missing row is an expected outcome the caller maps to
 * 404, not an exception.
 */
export async function deletePaddle(id: string): Promise<boolean> {
  try {
    const deleted = await db.transaction(async tx => {
      const [locked] = await tx
        .select()
        .from(paddles)
        .where(eq(paddles.id, id))
        .limit(1)
        .for('update');

      if (!locked) {
        return null;
      }

      await tx.delete(paddles).where(eq(paddles.id, id));

      return rowToPaddleItem(locked);
    });

    if (!deleted) {
      dbLogger.warn('Paddle not found for delete', { id });
      return false;
    }

    invalidatePaddleWriteTags({ id, statuses: [deleted.status] });

    return true;
  } catch (error) {
    logPaddleDataError('Error deleting paddle', error, { id });
    throw error;
  }
}
