'use server';

import { auth } from '@/auth';
import { ModuleAccessError, requireModuleAccess } from '@/lib/module-access';
import {
  internalErrorResult,
  notFoundErrorResult,
  unauthorizedErrorResult,
  validationErrorResult,
  zodFieldErrors,
  type ActionResult,
} from '@/lib/api/action-result';
import { sanitizeApiInput } from '@/lib/sanitization';
import { RecordNotFoundError } from '@/lib/data/errors';
import {
  getSpirits,
  getSpiritById,
  createSpirit as createSpiritData,
  updateSpirit as updateSpiritData,
  deleteSpirit as deleteSpiritData,
  countSpirits,
  type SpiritFilters,
} from '@/lib/data/spirits';
import {
  createSpiritSchema,
  updateSpiritSchema,
  spiritSearchSchema,
  type Spirit,
  type CreateSpiritInput,
  type UpdateSpiritInput,
  type SpiritSearchInput,
} from '@/modules/spirits/schema';

// ============================================================================
// Action Result Types
// ============================================================================

async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    return requireModuleAccess(session, 'spirits');
  } catch (error) {
    if (error instanceof ModuleAccessError) return null;
    throw error;
  }
}

function toDataLayerFilters(input?: SpiritSearchInput): SpiritFilters {
  return {
    ...(input?.filters?.spiritType ? { spiritType: input.filters.spiritType } : {}),
    ...(input?.filters?.status ? { status: input.filters.status } : {}),
    ...(input?.filters?.bottleStatus ? { bottleStatus: input.filters.bottleStatus } : {}),
    ...(input?.filters?.brand ? { brand: input.filters.brand } : {}),
    ...(input?.filters?.country ? { country: input.filters.country } : {}),
    ...(input?.filters?.region ? { region: input.filters.region } : {}),
    ...(input?.filters?.limitedEdition !== undefined
      ? { limitedEdition: input.filters.limitedEdition }
      : {}),
    ...(input?.filters?.search ? { search: input.filters.search } : {}),
    ...(input?.take !== undefined ? { limit: input.take } : {}),
    ...(input?.skip !== undefined ? { offset: input.skip } : {}),
    ...(input?.sortBy ? { sortBy: input.sortBy } : {}),
    ...(input?.sortOrder ? { sortOrder: input.sortOrder } : {}),
  };
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Get spirits list with filters
 */
export async function getSpiritsAction(
  input?: SpiritSearchInput
): Promise<ActionResult<{ spirits: Spirit[]; total: number; hasMore: boolean }>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return unauthorizedErrorResult();
    }

    // Validate input if provided
    if (input) {
      const validation = spiritSearchSchema.safeParse(input);
      if (!validation.success) {
        return validationErrorResult(
          '查询参数无效',
          zodFieldErrors(validation.error)
        );
      }
    }

    const filters = toDataLayerFilters(input);
    const spirits = await getSpirits(filters);
    const total = await countSpirits(filters);
    const hasMore = (filters.offset ?? 0) + spirits.length < total;

    return {
      success: true,
      data: { spirits, total, hasMore },
    };
  } catch (error) {
    console.error('[Server Action] getSpiritsAction error:', error);
    return internalErrorResult('获取藏酒列表失败');
  }
}

/**
 * Get single spirit by ID
 */
export async function getSpiritAction(id: string): Promise<ActionResult<Spirit>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('ID 无效');
    }

    const spirit = await getSpiritById(id);
    if (!spirit) {
      return notFoundErrorResult('藏酒不存在');
    }

    return {
      success: true,
      data: spirit,
    };
  } catch (error) {
    console.error('[Server Action] getSpiritAction error:', error);
    return internalErrorResult('获取藏酒失败');
  }
}

/**
 * Create a new spirit
 */
export async function createSpiritAction(input: CreateSpiritInput): Promise<ActionResult<Spirit>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return unauthorizedErrorResult();
    }

    // Validate input
    const validation = createSpiritSchema.safeParse(sanitizeApiInput(input));
    if (!validation.success) {
      return validationErrorResult(
        '输入数据无效',
        zodFieldErrors(validation.error)
      );
    }

    const spirit = await createSpiritData(validation.data);

    return {
      success: true,
      data: spirit,
    };
  } catch (error) {
    console.error('[Server Action] createSpiritAction error:', error);
    return internalErrorResult('创建藏酒失败');
  }
}

/**
 * Update an existing spirit
 */
export async function updateSpiritAction(
  id: string,
  input: UpdateSpiritInput
): Promise<ActionResult<Spirit>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('ID 无效');
    }

    // Validate input
    const validation = updateSpiritSchema.safeParse(sanitizeApiInput(input));
    if (!validation.success) {
      return validationErrorResult(
        '输入数据无效',
        zodFieldErrors(validation.error)
      );
    }

    const spirit = await updateSpiritData(id, validation.data);

    return {
      success: true,
      data: spirit,
    };
  } catch (error) {
    console.error('[Server Action] updateSpiritAction error:', error);
    if (error instanceof RecordNotFoundError) {
      return notFoundErrorResult('藏酒不存在');
    }
    return internalErrorResult('更新藏酒失败');
  }
}

/**
 * Delete a spirit
 */
export async function deleteSpiritAction(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return unauthorizedErrorResult();
    }

    if (!id || typeof id !== 'string') {
      return validationErrorResult('ID 无效');
    }

    const deleted = await deleteSpiritData(id);

    if (!deleted) {
      return notFoundErrorResult('藏酒不存在');
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('[Server Action] deleteSpiritAction error:', error);
    if (error instanceof RecordNotFoundError) {
      return notFoundErrorResult('藏酒不存在');
    }
    return internalErrorResult('删除藏酒失败');
  }
}
