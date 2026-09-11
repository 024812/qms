'use server';

import { z } from 'zod';

import { auth } from '@/auth';
import { ModuleAccessError, requireModuleAccess } from '@/lib/module-access';
import {
  countPaddles,
  createPaddle as createPaddleData,
  deletePaddle as deletePaddleData,
  getPaddleById,
  getPaddles,
  updatePaddle as updatePaddleData,
} from '@/lib/data/paddles';
import type { PaddleFilters } from '@/lib/data/paddles';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createPaddleSchema,
  updatePaddleSchema,
  type PaddleItem,
  type CreatePaddleInput,
  type UpdatePaddleInput,
} from '@/modules/paddles/schema';

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

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// ============================================================================
// Helper Functions
// ============================================================================

function validationErrorResult(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}

function notFoundErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
    },
  };
}

function internalErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  };
}

function unauthorizedErrorResult(message = 'Unauthorized'): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
}

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    return requireModuleAccess(session, 'paddles');
  } catch (error) {
    if (error instanceof ModuleAccessError) return null;
    throw error;
  }
}

function normalizePaddleInputDates<T extends Record<string, unknown> & { purchaseDate?: unknown }>(
  input: T
): T {
  const normalized = { ...input };

  if (typeof normalized.purchaseDate === 'string') {
    normalized.purchaseDate = new Date(normalized.purchaseDate);
  }

  return normalized;
}

// ============================================================================
// Read Actions
// ============================================================================

const paddleSearchSchema = z.object({
  filters: z
    .object({
      status: z.enum(['ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY']).optional(),
      bladeBrand: z.string().optional(),
      handleType: z.enum(['FL', 'ST', 'CS', 'AN']).optional(),
      search: z.string().optional(),
    })
    .optional(),
  sortBy: z
    .enum(['itemNumber', 'name', 'bladeBrand', 'bladeWeightG', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).max(100).optional(),
});

export type PaddleSearchInput = z.infer<typeof paddleSearchSchema>;

function toDataLayerFilters(input?: PaddleSearchInput): PaddleFilters {
  return {
    ...(input?.filters?.status ? { status: input.filters.status } : {}),
    ...(input?.filters?.bladeBrand ? { bladeBrand: input.filters.bladeBrand } : {}),
    ...(input?.filters?.handleType ? { handleType: input.filters.handleType } : {}),
    ...(input?.filters?.search ? { search: input.filters.search } : {}),
    ...(input?.take !== undefined ? { limit: input.take } : {}),
    ...(input?.skip !== undefined ? { offset: input.skip } : {}),
    ...(input?.sortBy ? { sortBy: input.sortBy } : {}),
    ...(input?.sortOrder ? { sortOrder: input.sortOrder } : {}),
  };
}

export async function getPaddlesAction(
  input?: PaddleSearchInput
): Promise<ActionResult<{ paddles: PaddleItem[]; total: number; hasMore: boolean }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    const validationResult = paddleSearchSchema.safeParse(input ?? {});

    if (!validationResult.success) {
      return validationErrorResult(
        '查询参数校验失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const filters = toDataLayerFilters(validationResult.data);
    const [paddles, total] = await Promise.all([
      getPaddles(filters),
      countPaddles({
        status: filters.status,
        bladeBrand: filters.bladeBrand,
        handleType: filters.handleType,
        search: filters.search,
      }),
    ]);

    const skip = input?.skip || 0;
    const hasMore = skip + paddles.length < total;

    return {
      success: true,
      data: {
        paddles,
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('[Server Action] getPaddlesAction error:', error);
    return internalErrorResult('获取底板列表失败');
  }
}

export async function getPaddleAction(id: string): Promise<ActionResult<PaddleItem>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('底板 ID 无效');
    }

    const paddle = await getPaddleById(id);

    if (!paddle) {
      return notFoundErrorResult('底板不存在');
    }

    return {
      success: true,
      data: paddle,
    };
  } catch (error) {
    console.error('[Server Action] getPaddleAction error:', error);
    return internalErrorResult('获取底板详情失败');
  }
}

// ============================================================================
// Write Actions
// ============================================================================

export async function createPaddleAction(
  input: CreatePaddleInput
): Promise<ActionResult<PaddleItem>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    const sanitizedInput = normalizePaddleInputDates(sanitizeApiInput(input));
    const validationResult = createPaddleSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return validationErrorResult(
        '底板数据校验失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const paddle = await createPaddleData(validationResult.data);

    return {
      success: true,
      data: paddle,
    };
  } catch (error) {
    console.error('[Server Action] createPaddleAction error:', error);
    return internalErrorResult('创建底板失败');
  }
}

export async function updatePaddleAction(
  input: UpdatePaddleInput
): Promise<ActionResult<PaddleItem>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    const sanitizedInput = normalizePaddleInputDates(sanitizeApiInput(input));
    const validationResult = updatePaddleSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return validationErrorResult(
        '底板数据校验失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { id, ...updateData } = validationResult.data;
    const paddle = await updatePaddleData(id, updateData);

    return {
      success: true,
      data: paddle,
    };
  } catch (error) {
    console.error('[Server Action] updatePaddleAction error:', error);
    if (error instanceof Error && error.message === 'Paddle not found') {
      return notFoundErrorResult('底板不存在');
    }
    return internalErrorResult('更新底板失败');
  }
}

export async function deletePaddleAction(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('底板 ID 无效');
    }

    const deleted = await deletePaddleData(id);

    return {
      success: true,
      data: { deleted },
    };
  } catch (error) {
    console.error('[Server Action] deletePaddleAction error:', error);
    if (error instanceof Error && error.message === 'Paddle not found') {
      return notFoundErrorResult('底板不存在');
    }
    return internalErrorResult('删除底板失败');
  }
}
