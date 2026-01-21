'use server';

/**
 * Usage Server Actions
 *
 * Server-side actions for usage record operations following Next.js 16 best practices.
 * These actions can be called directly from Client Components.
 *
 * Requirements: Next.js 16 Server Actions patterns
 */

import { revalidateTag } from 'next/cache';
import { db } from '@/db';
import { items, usageLogs } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Action result types
interface ActionSuccess<T> {
  success: true;
  data: T;
}

interface ActionError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ActionResult<T> = ActionSuccess<T> | ActionError;

interface StartUsageInput {
  quiltId: string;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string;
}

interface EndUsageInput {
  quiltId: string;
  notes?: string;
}

/**
 * Start using a quilt
 */
export async function startUsageAction(
  input: StartUsageInput
): Promise<ActionResult<{ usageLogId: string }>> {
  try {
    const { quiltId, usageType = 'REGULAR', notes } = input;

    if (!quiltId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子ID无效',
        },
      };
    }

    // Update item status to in_use
    await db
      .update(items)
      .set({
        status: 'in_use',
        updatedAt: new Date(),
      })
      .where(eq(items.id, quiltId));

    // Create usage log
    const [usageLog] = await db
      .insert(usageLogs)
      .values({
        itemId: quiltId,
        userId: quiltId, // TODO: Get from session
        action: 'status_changed',
        snapshot: {
          status: 'in_use',
          usageType,
          notes,
          startedAt: new Date().toISOString(),
        },
      })
      .returning();

    // Revalidate cache
    revalidateTag('quilts', 'max');
    revalidateTag('usage', 'max');
    revalidateTag('dashboard', 'max');

    return {
      success: true,
      data: { usageLogId: usageLog.id },
    };
  } catch (error) {
    console.error('[Server Action] startUsageAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '开始使用失败',
      },
    };
  }
}

/**
 * End using a quilt
 */
export async function endUsageAction(
  input: EndUsageInput
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { quiltId, notes } = input;

    if (!quiltId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子ID无效',
        },
      };
    }

    // Update item status to storage
    await db
      .update(items)
      .set({
        status: 'storage',
        updatedAt: new Date(),
      })
      .where(eq(items.id, quiltId));

    // Create usage log for end
    await db.insert(usageLogs).values({
      itemId: quiltId,
      userId: quiltId, // TODO: Get from session
      action: 'status_changed',
      snapshot: {
        status: 'storage',
        notes,
        endedAt: new Date().toISOString(),
      },
    });

    // Revalidate cache
    revalidateTag('quilts', 'max');
    revalidateTag('usage', 'max');
    revalidateTag('dashboard', 'max');

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error('[Server Action] endUsageAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '结束使用失败',
      },
    };
  }
}

// Suppress unused variable warning
void and;
void isNull;
