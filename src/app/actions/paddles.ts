'use server';

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
import { RecordNotFoundError } from '@/lib/data/errors';
import {
  internalErrorResult,
  notFoundErrorResult,
  unauthorizedErrorResult,
  validationErrorResult,
  zodFieldErrors,
  type ActionResult,
} from '@/lib/api/action-result';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createPaddleSchema,
  paddleSearchSchema,
  updatePaddleSchema,
  type PaddleItem,
  type PaddleSearchInput,
  type CreatePaddleInput,
  type UpdatePaddleInput,
} from '@/modules/paddles/schema';

// Re-exported so existing importers (`api/paddles/route.ts`, the paddles page and its
// client shell) keep working. The schema itself now lives in the module, composed from
// `paddleFiltersSchema`, so the filter enums have a single definition.
export type { PaddleSearchInput };

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

    // Sanitise before validating, matching `getQuiltsAction`. Without this the search
    // term reaches the DAL unsanitised while quilts' does not.
    const sanitizedInput = input ? sanitizeApiInput(input) : {};
    const validationResult = paddleSearchSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return validationErrorResult(
        '查询参数校验失败',
        zodFieldErrors(validationResult.error)
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
        zodFieldErrors(validationResult.error)
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
        zodFieldErrors(validationResult.error)
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
    if (error instanceof RecordNotFoundError) {
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

    if (!deleted) {
      return notFoundErrorResult('底板不存在');
    }

    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    console.error('[Server Action] deletePaddleAction error:', error);
    if (error instanceof RecordNotFoundError) {
      return notFoundErrorResult('底板不存在');
    }
    return internalErrorResult('删除底板失败');
  }
}
