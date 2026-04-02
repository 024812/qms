'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';

import {
  createUsageRecord as createUsageRecordData,
  deleteUsageRecord as deleteUsageRecordData,
  getActiveUsageRecord,
  getAllActiveUsageRecords,
  getUsageHistory,
  getUsageRecordById,
  getUsageRecordsWithQuilts,
  updateUsageRecord as updateUsageRecordData,
} from '@/lib/data/usage';
import { getSimpleUsageStats } from '@/lib/data/stats';
import { sanitizeApiInput } from '@/lib/sanitization';
import { UsageTypeSchema } from '@/lib/validations/quilt';
import type { UsageRecord } from '@/lib/database/types';
import type { UsageRecordWithQuilt } from '@/lib/data/usage';

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

interface UsageFilters {
  quiltId?: string;
  limit?: number;
  offset?: number;
}

interface QuiltUsageStats {
  totalUsages: number;
  totalDays: number;
  averageDays: number;
  lastUsedDate: Date | null;
}

const usageRecordIdSchema = z.string().trim().min(1, 'Usage record id is required');
const quiltIdSchema = z.string().trim().min(1, 'Quilt id is required');

const usageFiltersSchema = z.object({
  quiltId: quiltIdSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

const createUsageRecordSchema = z
  .object({
    quiltId: quiltIdSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    usageType: UsageTypeSchema.optional().default('REGULAR'),
    notes: z.string().max(500, 'Notes must be 500 characters or less').nullable().optional(),
  })
  .refine(input => !input.endDate || input.endDate >= input.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

const updateUsageRecordSchema = z
  .object({
    id: usageRecordIdSchema,
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    usageType: UsageTypeSchema.optional(),
    notes: z.string().max(500, 'Notes must be 500 characters or less').nullable().optional(),
  })
  .refine(
    input => {
      if (input.startDate && input.endDate) {
        return input.endDate >= input.startDate;
      }

      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

const endUsageRecordSchema = z.object({
  quiltId: quiltIdSchema,
  endDate: z.coerce.date(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').nullable().optional(),
});

function refreshUsageActionCaches(options?: { quiltId?: string; usageRecordId?: string }) {
  updateTag('usage');
  updateTag('usage-list');
  updateTag('usage-active');
  updateTag('stats');
  updateTag('stats-dashboard');
  updateTag('stats-analytics');
  updateTag('quilts');
  updateTag('quilts-list');

  if (options?.quiltId) {
    updateTag(`usage-quilt-${options.quiltId}`);
    updateTag(`quilts-${options.quiltId}`);
  }

  if (options?.usageRecordId) {
    updateTag(`usage-${options.usageRecordId}`);
  }
}

function toQuiltUsageStats(records: UsageRecord[]): QuiltUsageStats {
  const totalUsages = records.length;
  const totalDays = records.reduce((sum, record) => {
    if (!record.endDate) {
      return sum;
    }

    const durationMs = record.endDate.getTime() - record.startDate.getTime();
    const durationDays = Math.max(0, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
    return sum + durationDays;
  }, 0);

  return {
    totalUsages,
    totalDays,
    averageDays: totalUsages > 0 ? totalDays / totalUsages : 0,
    lastUsedDate: records[0]?.startDate ?? null,
  };
}

function validationErrorResult(
  message: string,
  fieldErrors: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message,
      fieldErrors,
    },
  };
}

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as unknown as Record<string, string[]>;
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

export async function getUsageRecordsAction(
  filters?: UsageFilters
): Promise<ActionResult<{ records: UsageRecordWithQuilt[]; total: number; hasMore: boolean }>> {
  try {
    const validationResult = usageFiltersSchema.safeParse(filters ?? {});

    if (!validationResult.success) {
      return validationErrorResult(
        'Usage filters are invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const resolvedFilters = validationResult.data;
    const records = await getUsageRecordsWithQuilts(resolvedFilters);

    return {
      success: true,
      data: {
        records,
        total: records.length,
        hasMore: records.length === (resolvedFilters.limit ?? 50),
      },
    };
  } catch {
    return internalErrorResult('Failed to load usage records');
  }
}

export async function getUsageRecordAction(id: string): Promise<ActionResult<UsageRecord | null>> {
  try {
    const validationResult = usageRecordIdSchema.safeParse(id);

    if (!validationResult.success) {
      return validationErrorResult(
        'Usage record id is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const record = await getUsageRecordById(validationResult.data);

    return {
      success: true,
      data: record,
    };
  } catch {
    return internalErrorResult('Failed to load usage record');
  }
}

export async function getQuiltUsageRecordsAction(
  quiltId: string,
  options?: { includeStats?: boolean }
): Promise<
  ActionResult<{
    records: UsageRecord[];
    total: number;
    activeRecord: UsageRecord | null;
    stats?: QuiltUsageStats;
  }>
> {
  try {
    const validationResult = quiltIdSchema.safeParse(quiltId);

    if (!validationResult.success) {
      return validationErrorResult('Quilt id is invalid', zodFieldErrors(validationResult.error));
    }

    const [records, activeRecord] = await Promise.all([
      getUsageHistory(validationResult.data),
      getActiveUsageRecord(validationResult.data),
    ]);

    const data: {
      records: UsageRecord[];
      total: number;
      activeRecord: UsageRecord | null;
      stats?: QuiltUsageStats;
    } = {
      records,
      total: records.length,
      activeRecord,
    };

    if (options?.includeStats) {
      data.stats = toQuiltUsageStats(records);
    }

    return {
      success: true,
      data,
    };
  } catch {
    return internalErrorResult('Failed to load quilt usage records');
  }
}

export async function getActiveUsageRecordAction(
  quiltId: string
): Promise<ActionResult<UsageRecord | null>> {
  try {
    const validationResult = quiltIdSchema.safeParse(quiltId);

    if (!validationResult.success) {
      return validationErrorResult('Quilt id is invalid', zodFieldErrors(validationResult.error));
    }

    const record = await getActiveUsageRecord(validationResult.data);

    return {
      success: true,
      data: record,
    };
  } catch {
    return internalErrorResult('Failed to load active usage record');
  }
}

export async function getAllActiveUsageRecordsAction(): Promise<
  ActionResult<{ records: UsageRecord[]; total: number }>
> {
  try {
    const records = await getAllActiveUsageRecords();

    return {
      success: true,
      data: {
        records,
        total: records.length,
      },
    };
  } catch {
    return internalErrorResult('Failed to load active usage records');
  }
}

export async function getUsageStatsAction(quiltId: string): Promise<ActionResult<QuiltUsageStats>> {
  try {
    const validationResult = quiltIdSchema.safeParse(quiltId);

    if (!validationResult.success) {
      return validationErrorResult('Quilt id is invalid', zodFieldErrors(validationResult.error));
    }

    const records = await getUsageHistory(validationResult.data);

    return {
      success: true,
      data: toQuiltUsageStats(records),
    };
  } catch {
    return internalErrorResult('Failed to load usage statistics');
  }
}

export async function getOverallUsageStatsAction(): Promise<
  ActionResult<{ total: number; active: number; completed: number }>
> {
  try {
    const stats = await getSimpleUsageStats();

    return {
      success: true,
      data: stats,
    };
  } catch {
    return internalErrorResult('Failed to load overall usage statistics');
  }
}

export async function createUsageRecordAction(input: {
  quiltId: string;
  startDate: Date;
  endDate?: Date | null;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string | null;
}): Promise<ActionResult<UsageRecord>> {
  try {
    const validationResult = createUsageRecordSchema.safeParse(sanitizeApiInput(input));

    if (!validationResult.success) {
      return validationErrorResult(
        'Usage record data is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const record = await createUsageRecordData(validationResult.data);
    refreshUsageActionCaches({ quiltId: record.quiltId, usageRecordId: record.id });

    return {
      success: true,
      data: record,
    };
  } catch {
    return internalErrorResult('Failed to create usage record');
  }
}

export async function updateUsageRecordAction(input: {
  id: string;
  startDate?: Date;
  endDate?: Date | null;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string | null;
}): Promise<ActionResult<UsageRecord>> {
  try {
    const validationResult = updateUsageRecordSchema.safeParse(sanitizeApiInput(input));

    if (!validationResult.success) {
      return validationErrorResult(
        'Usage record data is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const { id, ...updates } = validationResult.data;
    const currentRecord = await getUsageRecordById(id);

    if (!currentRecord) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Usage record not found',
        },
      };
    }

    const record = await updateUsageRecordData(id, updates);

    if (!record) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Usage record not found',
        },
      };
    }

    refreshUsageActionCaches({ quiltId: currentRecord.quiltId, usageRecordId: record.id });

    return {
      success: true,
      data: record,
    };
  } catch {
    return internalErrorResult('Failed to update usage record');
  }
}

export async function endUsageRecordAction(input: {
  quiltId: string;
  endDate: Date;
  notes?: string | null;
}): Promise<ActionResult<UsageRecord>> {
  try {
    const validationResult = endUsageRecordSchema.safeParse(sanitizeApiInput(input));

    if (!validationResult.success) {
      return validationErrorResult(
        'Usage record data is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const activeRecord = await getActiveUsageRecord(validationResult.data.quiltId);

    if (!activeRecord) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Active usage record not found',
        },
      };
    }

    const record = await updateUsageRecordData(activeRecord.id, {
      endDate: validationResult.data.endDate,
      ...(validationResult.data.notes !== undefined ? { notes: validationResult.data.notes } : {}),
    });

    if (!record) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Active usage record not found',
        },
      };
    }

    refreshUsageActionCaches({
      quiltId: validationResult.data.quiltId,
      usageRecordId: record.id,
    });

    return {
      success: true,
      data: record,
    };
  } catch {
    return internalErrorResult('Failed to end usage record');
  }
}

export async function deleteUsageRecordAction(
  id: string
): Promise<ActionResult<{ deleted: true; id: string }>> {
  try {
    const validationResult = usageRecordIdSchema.safeParse(id);

    if (!validationResult.success) {
      return validationErrorResult(
        'Usage record id is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const currentRecord = await getUsageRecordById(validationResult.data);

    if (!currentRecord) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Usage record not found',
        },
      };
    }

    const deleted = await deleteUsageRecordData(validationResult.data);

    if (!deleted) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Usage record not found',
        },
      };
    }

    refreshUsageActionCaches({
      quiltId: currentRecord.quiltId,
      usageRecordId: validationResult.data,
    });

    return {
      success: true,
      data: {
        deleted: true,
        id: validationResult.data,
      },
    };
  } catch {
    return internalErrorResult('Failed to delete usage record');
  }
}
