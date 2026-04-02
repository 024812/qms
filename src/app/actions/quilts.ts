'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';

import {
  countQuilts,
  deleteQuilt as deleteQuiltData,
  getQuiltById,
  getQuilts,
  saveQuilt,
} from '@/lib/data/quilts';
import { sanitizeApiInput } from '@/lib/sanitization';
import { createQuiltSchema, quiltSearchSchema, updateQuiltSchema } from '@/lib/validations/quilt';
import type { Quilt, CreateQuiltInput, UpdateQuiltInput } from '@/lib/validations/quilt';
import type { QuiltSearchInput } from '@/types/quilt';
import type { QuiltFilters } from '@/lib/data/quilts';

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

const changeQuiltStatusSchema = z.object({
  quiltId: z.string().min(1, '被子 ID 无效'),
  status: z.enum(['IN_USE', 'STORAGE', 'MAINTENANCE']),
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

function refreshQuiltActionCaches(id?: string) {
  updateTag('quilts');
  updateTag('quilts-list');
  updateTag('stats');
  updateTag('stats-dashboard');
  updateTag('usage');
  updateTag('usage-list');
  updateTag('usage-active');

  if (id) {
    updateTag(`quilts-${id}`);
    updateTag(`usage-quilt-${id}`);
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
    const sanitizedInput = normalizeQuiltInputDates(sanitizeApiInput(input));
    const maybeId = 'id' in sanitizedInput ? sanitizedInput.id : undefined;
    const isUpdate = typeof maybeId === 'string' && maybeId.length > 0;

    const validationResult = isUpdate
      ? updateQuiltSchema.safeParse(sanitizedInput)
      : createQuiltSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子数据校验失败',
          fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }

    const result = await saveQuilt(validationResult.data as CreateQuiltInput | UpdateQuiltInput);
    refreshQuiltActionCaches(result.quilt.id);

    return {
      success: true,
      data: result.quilt as Quilt,
    };
  } catch (error) {
    console.error('[Server Action] saveQuiltAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '保存被子失败',
      },
    };
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
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子 ID 无效',
        },
      };
    }

    await deleteQuiltData(id);
    refreshQuiltActionCaches(id);

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

export async function changeQuiltStatusAction(input: {
  quiltId: string;
  status: 'IN_USE' | 'STORAGE' | 'MAINTENANCE';
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}): Promise<ActionResult<{ quilt: Quilt; usageRecord: unknown | null }>> {
  try {
    const validationResult = changeQuiltStatusSchema.safeParse(sanitizeApiInput(input));

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '状态数据校验失败',
          fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }

    const { quiltId, status, usageType, notes, startDate, endDate } = validationResult.data;
    const { updateQuiltStatusWithUsageRecord } = await import('@/lib/data/quilts');
    const result = await updateQuiltStatusWithUsageRecord(quiltId, status, usageType, notes, {
      startDate,
      endDate,
    });
    refreshQuiltActionCaches(quiltId);

    return {
      success: true,
      data: {
        quilt: result.quilt as Quilt,
        usageRecord: result.usageRecord ?? null,
      },
    };
  } catch (error) {
    console.error('[Server Action] changeQuiltStatusAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '更新被子状态失败',
      },
    };
  }
}

export async function getQuiltAction(id: string): Promise<ActionResult<Quilt | null>> {
  try {
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子 ID 无效',
        },
      };
    }

    const quilt = await getQuiltById(id);

    return {
      success: true,
      data: quilt as Quilt | null,
    };
  } catch (error) {
    console.error('[Server Action] getQuiltAction error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '获取被子详情失败',
      },
    };
  }
}

export async function getQuiltsAction(
  input?: QuiltSearchInput
): Promise<ActionResult<{ quilts: Quilt[]; total: number; hasMore: boolean }>> {
  try {
    const sanitizedInput = sanitizeApiInput(input ?? {});
    const validationResult = quiltSearchSchema.safeParse(sanitizedInput);

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '被子查询参数校验失败',
          fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
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
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '获取被子列表失败',
      },
    };
  }
}
