'use server';

import { z } from 'zod';

import { auth } from '@/auth';
import { ModuleAccessError, requireModuleAccess } from '@/lib/module-access';
import {
  QuiltBusinessRuleError,
  countQuilts,
  deleteQuilt as deleteQuiltData,
  getQuiltById,
  getQuilts,
  saveQuilt,
} from '@/lib/data/quilts';
import { sanitizeApiInput } from '@/lib/sanitization';
import { ConflictError, RecordNotFoundError } from '@/lib/data/errors';
import {
  QuiltStatusSchema,
  createQuiltSchema,
  quiltSearchSchema,
  updateQuiltSchema,
} from '@/lib/validations/quilt';
import type { Quilt, CreateQuiltInput, QuiltStatus, UpdateQuiltInput } from '@/lib/validations/quilt';
import type { QuiltSearchInput } from '@/types/quilt';
import type { QuiltFilters } from '@/lib/data/quilts';
import {
  conflictErrorResult,
  internalErrorResult,
  notFoundErrorResult,
  unauthorizedErrorResult,
  validationErrorResult,
  zodFieldErrors,
  type ActionResult,
} from '@/lib/api/action-result';

const changeQuiltStatusSchema = z.object({
  quiltId: z.string().min(1, '被子 ID 无效'),
  status: QuiltStatusSchema,
  usageType: z
    .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'])
    .optional()
    .default('REGULAR'),
  notes: z.string().max(500, '备注不能超过 500 个字符').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

function normalizeQuiltInputDates<T extends Record<string, unknown> & { purchaseDate?: unknown }>(
  input: T
): T {
  const normalized = { ...input };

  if (typeof normalized.purchaseDate === 'string') {
    normalized.purchaseDate = new Date(normalized.purchaseDate);
  }

  return normalized;
}

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    return requireModuleAccess(session, 'quilts');
  } catch (error) {
    if (error instanceof ModuleAccessError) return null;
    throw error;
  }
}

function toDataLayerFilters(input?: QuiltSearchInput): QuiltFilters {
  return {
    ...(input?.filters?.season ? { season: input.filters.season } : {}),
    ...(input?.filters?.status ? { status: input.filters.status } : {}),
    ...(input?.filters?.location ? { location: input.filters.location } : {}),
    ...(input?.filters?.brand ? { brand: input.filters.brand } : {}),
    ...(input?.filters?.search ? { search: input.filters.search } : {}),
    ...(input?.take !== undefined ? { limit: input.take } : {}),
    ...(input?.skip !== undefined ? { offset: input.skip } : {}),
    ...(input?.sortBy ? { sortBy: input.sortBy } : {}),
    ...(input?.sortOrder ? { sortOrder: input.sortOrder } : {}),
  };
}

export async function saveQuiltAction(
  input: CreateQuiltInput | UpdateQuiltInput
): Promise<ActionResult<Quilt>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    const sanitizedInput = normalizeQuiltInputDates(sanitizeApiInput(input));
    const maybeId = 'id' in sanitizedInput ? sanitizedInput.id : undefined;
    const isUpdate = typeof maybeId === 'string' && maybeId.length > 0;

    const validationResult = isUpdate
      ? updateQuiltSchema.safeParse(sanitizedInput)
      : createQuiltSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return validationErrorResult(
        '被子数据校验失败',
        zodFieldErrors(validationResult.error)
      );
    }

    const result = await saveQuilt(validationResult.data as CreateQuiltInput | UpdateQuiltInput);

    return {
      success: true,
      data: result.quilt as Quilt,
    };
  } catch (error) {
    console.error('[Server Action] saveQuiltAction error:', error);
    if (error instanceof RecordNotFoundError) {
      return notFoundErrorResult('被子不存在');
    }

    // Business rules that need the stored row are enforced in the DAL; surface them
    // as an ordinary validation failure rather than a 500.
    if (error instanceof QuiltBusinessRuleError) {
      return validationErrorResult('被子数据校验失败', error.fieldErrors);
    }

    return internalErrorResult('保存被子失败');
  }
}

export async function createQuiltAction(input: CreateQuiltInput): Promise<ActionResult<Quilt>> {
  return saveQuiltAction(input);
}

export async function updateQuiltAction(input: UpdateQuiltInput): Promise<ActionResult<Quilt>> {
  return saveQuiltAction(input);
}

export async function deleteQuiltAction(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('被子 ID 无效');
    }

    const deleted = await deleteQuiltData(id);

    if (!deleted) {
      return notFoundErrorResult('被子不存在');
    }

    return {
      success: true,
      data: { deleted: true },
    };
  } catch (error) {
    console.error('[Server Action] deleteQuiltAction error:', error);
    return internalErrorResult('删除被子失败');
  }
}

export async function changeQuiltStatusAction(input: {
  quiltId: string;
  status: QuiltStatus;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}): Promise<ActionResult<{ quilt: Quilt; usageRecord: unknown | null }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    const validationResult = changeQuiltStatusSchema.safeParse(sanitizeApiInput(input));

    if (!validationResult.success) {
      return validationErrorResult(
        '状态数据校验失败',
        zodFieldErrors(validationResult.error)
      );
    }

    const { quiltId, status, usageType, notes, startDate, endDate } = validationResult.data;
    const { updateQuiltStatusWithUsageRecord } = await import('@/lib/data/quilts');
    const result = await updateQuiltStatusWithUsageRecord(quiltId, status, usageType, notes, {
      startDate,
      endDate,
    });

    return {
      success: true,
      data: {
        quilt: result.quilt as Quilt,
        usageRecord: result.usageRecord ?? null,
      },
    };
  } catch (error) {
    console.error('[Server Action] changeQuiltStatusAction error:', error);
    if (error instanceof RecordNotFoundError) {
      return notFoundErrorResult('被子不存在');
    }

    if (error instanceof ConflictError) {
      return conflictErrorResult('该被子已有活跃的使用记录');
    }

    return internalErrorResult('更新被子状态失败');
  }
}

export async function getQuiltAction(id: string): Promise<ActionResult<Quilt | null>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('被子 ID 无效');
    }

    const quilt = await getQuiltById(id);

    return {
      success: true,
      data: quilt as Quilt | null,
    };
  } catch (error) {
    console.error('[Server Action] getQuiltAction error:', error);
    return internalErrorResult('获取被子详情失败');
  }
}

export async function getQuiltsAction(
  input?: QuiltSearchInput
): Promise<ActionResult<{ quilts: Quilt[]; total: number; hasMore: boolean }>> {
  try {
    const session = await requireAuthenticatedUser();

    if (!session) {
      return unauthorizedErrorResult();
    }

    const sanitizedInput = sanitizeApiInput(input ?? {});
    const validationResult = quiltSearchSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return validationErrorResult(
        '被子查询参数校验失败',
        zodFieldErrors(validationResult.error)
      );
    }

    const filters = toDataLayerFilters(validationResult.data);
    const [quilts, total] = await Promise.all([getQuilts(filters), countQuilts(filters)]);

    return {
      success: true,
      data: {
        quilts: quilts as Quilt[],
        total,
        hasMore: (filters.offset ?? 0) + quilts.length < total,
      },
    };
  } catch (error) {
    console.error('[Server Action] getQuiltsAction error:', error);
    return internalErrorResult('获取被子列表失败');
  }
}
