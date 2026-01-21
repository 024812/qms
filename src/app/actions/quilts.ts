'use server';

/**
 * Quilts Server Actions
 *
 * Server-side actions for quilt operations following Next.js 16 best practices.
 * These actions can be called directly from Client Components.
 *
 * Benefits over API routes:
 * - Automatic serialization/deserialization
 * - Progressive enhancement support
 * - Reduced client-side bundle size
 * - Direct database access without HTTP overhead
 *
 * Requirements: Next.js 16 Server Actions patterns
 */

import { revalidateTag } from 'next/cache';
import {
  createQuilt,
  updateQuilt as updateQuiltData,
  deleteQuilt as deleteQuiltData,
  getQuilts,
} from '@/lib/data/quilts';
import { createQuiltSchema, updateQuiltSchema } from '@/lib/validations/quilt';
import { sanitizeApiInput } from '@/lib/sanitization';
import type { Quilt, CreateQuiltInput, UpdateQuiltInput } from '@/lib/validations/quilt';

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
    fieldErrors?: Record<string, string[]>;
  };
}

type ActionResult<T> = ActionSuccess<T> | ActionError;

/**
 * Create a new quilt
 */
export async function createQuiltAction(input: CreateQuiltInput): Promise<ActionResult<Quilt>> {
  try {
    // Sanitize input
    const sanitizedInput = sanitizeApiInput(input);

    // Handle purchaseDate conversion
    if (sanitizedInput.purchaseDate && typeof sanitizedInput.purchaseDate === 'string') {
      sanitizedInput.purchaseDate = new Date(sanitizedInput.purchaseDate);
    }

    // Validate with Zod
    const result = createQuiltSchema.safeParse(sanitizedInput);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子数据验证失败',
          fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }

    // Create quilt
    const quilt = await createQuilt(result.data);

    // Revalidate cache
    revalidateTag('quilts', 'max');
    revalidateTag('dashboard', 'max');

    return {
      success: true,
      data: quilt as Quilt,
    };
  } catch (error) {
    console.error('[Server Action] createQuiltAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '创建被子失败',
      },
    };
  }
}

/**
 * Update an existing quilt
 */
export async function updateQuiltAction(input: UpdateQuiltInput): Promise<ActionResult<Quilt>> {
  try {
    // Sanitize input
    const sanitizedInput = sanitizeApiInput(input);

    // Handle purchaseDate conversion
    if (sanitizedInput.purchaseDate && typeof sanitizedInput.purchaseDate === 'string') {
      sanitizedInput.purchaseDate = new Date(sanitizedInput.purchaseDate);
    }

    // Validate with Zod
    const result = updateQuiltSchema.safeParse(sanitizedInput);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子数据验证失败',
          fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }

    // Update quilt
    const { id, ...updateData } = result.data;
    const quilt = await updateQuiltData(id, updateData);

    // Revalidate cache
    revalidateTag('quilts', 'max');
    revalidateTag('dashboard', 'max');
    revalidateTag('usage', 'max');

    return {
      success: true,
      data: quilt as Quilt,
    };
  } catch (error) {
    console.error('[Server Action] updateQuiltAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '更新被子失败',
      },
    };
  }
}

/**
 * Delete a quilt
 */
export async function deleteQuiltAction(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子ID无效',
        },
      };
    }

    // Delete quilt
    await deleteQuiltData(id);

    // Revalidate cache
    revalidateTag('quilts', 'max');
    revalidateTag('dashboard', 'max');
    revalidateTag('usage', 'max');

    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    console.error('[Server Action] deleteQuiltAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '删除被子失败',
      },
    };
  }
}

/**
 * Get quilts list (for Server Components)
 */
export async function getQuiltsAction(filters?: {
  season?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ quilts: Quilt[]; total: number }>> {
  try {
    const quilts = await getQuilts(filters as Parameters<typeof getQuilts>[0]);

    return {
      success: true,
      data: {
        quilts: quilts as Quilt[],
        total: quilts.length,
      },
    };
  } catch (error) {
    console.error('[Server Action] getQuiltsAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '获取被子列表失败',
      },
    };
  }
}
