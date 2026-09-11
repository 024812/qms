'use server';

import { auth } from '@/auth';
import { ModuleAccessError, requireModuleAccess } from '@/lib/module-access';
import {
  countAntiques,
  createAntique as createAntiqueData,
  deleteAntique as deleteAntiqueData,
  getAntiqueById,
  getAntiques,
  updateAntique as updateAntiqueData,
} from '@/lib/data/antiques';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createAntiqueSchema,
  updateAntiqueSchema,
  type AntiqueItem,
  type AntiqueCategory,
  type AntiqueStatus,
} from '@/modules/antiques/schema';
import type { AntiqueSortField, SortOrder } from '@/lib/data/antiques';

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

function unauthorizedErrorResult(message: string): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
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

function normalizeAntiqueInputDates<
  T extends Record<string, unknown> & {
    appraisalDate?: unknown;
    acquiredDate?: unknown;
  },
>(input: T): T {
  const normalized = { ...input };

  if (typeof normalized.appraisalDate === 'string') {
    normalized.appraisalDate = new Date(normalized.appraisalDate);
  }

  if (typeof normalized.acquiredDate === 'string') {
    normalized.acquiredDate = new Date(normalized.acquiredDate);
  }

  return normalized;
}

/**
 * Get antiques with filtering, sorting, and pagination
 */
export async function getAntiquesAction(filters?: {
  category?: AntiqueCategory;
  status?: AntiqueStatus;
  era?: string;
  dynasty?: string;
  search?: string;
  minValue?: number;
  maxValue?: number;
  limit?: number;
  offset?: number;
  sortBy?: AntiqueSortField;
  sortOrder?: SortOrder;
}): Promise<ActionResult<{ antiques: AntiqueItem[]; total: number; hasMore: boolean }>> {
  try {
    const session = await auth();
    requireModuleAccess(session, 'antiques');

    const antiques = await getAntiques(filters);
    const total = await countAntiques(filters);
    const hasMore =
      filters?.offset !== undefined && filters?.limit !== undefined
        ? filters.offset + filters.limit < total
        : false;

    return {
      success: true,
      data: {
        antiques,
        total,
        hasMore,
      },
    };
  } catch (error) {
    if (error instanceof ModuleAccessError) {
      return unauthorizedErrorResult('您没有权限访问文玩管理模块');
    }
    return internalErrorResult('获取文玩列表失败');
  }
}

/**
 * Get a single antique by ID
 */
export async function getAntiqueAction(id: string): Promise<ActionResult<AntiqueItem | null>> {
  try {
    const session = await auth();
    requireModuleAccess(session, 'antiques');

    if (!id || typeof id !== 'string') {
      return validationErrorResult('文玩 ID 无效');
    }

    const antique = await getAntiqueById(id);
    return {
      success: true,
      data: antique,
    };
  } catch (error) {
    if (error instanceof ModuleAccessError) {
      return unauthorizedErrorResult('您没有权限访问文玩管理模块');
    }
    return internalErrorResult('获取文玩详情失败');
  }
}

/**
 * Create a new antique
 */
export async function createAntiqueAction(input: unknown): Promise<ActionResult<AntiqueItem>> {
  try {
    const session = await auth();
    requireModuleAccess(session, 'antiques');

    const sanitized = sanitizeApiInput(input as Record<string, unknown>);
    const normalized = normalizeAntiqueInputDates(sanitized);
    const parsed = createAntiqueSchema.safeParse(normalized);

    if (!parsed.success) {
      return validationErrorResult(
        '输入数据验证失败',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const antique = await createAntiqueData(parsed.data);
    return {
      success: true,
      data: antique,
    };
  } catch (error) {
    if (error instanceof ModuleAccessError) {
      return unauthorizedErrorResult('您没有权限创建文玩');
    }
    return internalErrorResult('创建文玩失败');
  }
}

/**
 * Update an existing antique
 */
export async function updateAntiqueAction(input: unknown): Promise<ActionResult<AntiqueItem>> {
  try {
    const session = await auth();
    requireModuleAccess(session, 'antiques');

    const sanitized = sanitizeApiInput(input as Record<string, unknown>);
    const normalized = normalizeAntiqueInputDates(sanitized);
    const parsed = updateAntiqueSchema.safeParse(normalized);

    if (!parsed.success) {
      return validationErrorResult(
        '输入数据验证失败',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Check if antique exists
    const existing = await getAntiqueById(parsed.data.id);
    if (!existing) {
      return notFoundErrorResult('文玩不存在');
    }

    const antique = await updateAntiqueData(parsed.data);
    return {
      success: true,
      data: antique,
    };
  } catch (error) {
    if (error instanceof ModuleAccessError) {
      return unauthorizedErrorResult('您没有权限更新文玩');
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return notFoundErrorResult('文玩不存在');
    }

    return internalErrorResult('更新文玩失败');
  }
}

/**
 * Delete an antique
 */
export async function deleteAntiqueAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    requireModuleAccess(session, 'antiques');

    if (!id || typeof id !== 'string') {
      return validationErrorResult('文玩 ID 无效');
    }

    // Check if antique exists
    const existing = await getAntiqueById(id);
    if (!existing) {
      return notFoundErrorResult('文玩不存在');
    }

    await deleteAntiqueData(id);
    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    if (error instanceof ModuleAccessError) {
      return unauthorizedErrorResult('您没有权限删除文玩');
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return notFoundErrorResult('文玩不存在');
    }

    return internalErrorResult('删除文玩失败');
  }
}
