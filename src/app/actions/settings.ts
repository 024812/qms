'use server';

import { z } from 'zod';

import {
  changePassword as changePasswordData,
  PasswordChangeError,
  getAppSettings as getAppSettingsData,
  getDatabaseStats as getDatabaseStatsData,
  getExportData as getExportDataData,
  getSystemInfo as getSystemInfoData,
  updateAppSettings as updateAppSettingsData,
} from '@/lib/data/settings';
import {
  createUserApiKey,
  listUserApiKeys,
  revokeUserApiKey,
  type CreatedUserApiKey,
  type UserApiKeySummary,
} from '@/lib/data/user-api-keys';
import { auth } from '@/auth';
import { sanitizeApiInput } from '@/lib/sanitization';
import type {
  AppSettings,
  ChangePasswordInput,
  DatabaseStats,
  ExportData,
  SystemInfo,
  UpdateAppSettingsInput,
} from '@/lib/types/settings';
import {
  internalErrorResult,
  unauthorizedErrorResult,
  validationErrorResult,
  zodFieldErrors,
  type ActionResult,
} from '@/lib/api/action-result';

const updateAppSettingsSchema = z.object({
  appName: z.string().trim().min(1).max(100).optional(),
  language: z.enum(['zh', 'en']).optional(),
  itemsPerPage: z.number().int().min(10).max(100).optional(),
  defaultView: z.enum(['list', 'grid']).optional(),
  doubleClickAction: z.enum(['none', 'view', 'status', 'edit']).optional(),
  usageDoubleClickAction: z.enum(['none', 'view', 'edit']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
});

const revokeApiKeySchema = z.object({
  id: z.string().min(1),
});

async function requireAuthenticatedUser() {
  const session = await auth();
  return session?.user?.id ? session : null;
}

async function requireAdmin() {
  const session = await requireAuthenticatedUser();
  return session?.user?.role === 'admin' ? session : null;
}

export async function getAppSettingsAction(): Promise<ActionResult<AppSettings>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) return unauthorizedErrorResult();

    return {
      success: true,
      data: await getAppSettingsData(),
    };
  } catch {
    return internalErrorResult('Failed to load application settings');
  }
}

export async function updateAppSettingsAction(
  input: UpdateAppSettingsInput
): Promise<ActionResult<AppSettings>> {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorizedErrorResult('Requires admin privileges');

    const validationResult = updateAppSettingsSchema.safeParse(
      sanitizeApiInput(input as unknown as Record<string, unknown>)
    );

    if (!validationResult.success) {
      return validationErrorResult(
        'Application settings are invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    const settings = await updateAppSettingsData(validationResult.data);

    return {
      success: true,
      data: settings,
    };
  } catch {
    return internalErrorResult('Failed to update application settings');
  }
}

export async function getDatabaseStatsAction(): Promise<ActionResult<DatabaseStats>> {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorizedErrorResult('Requires admin privileges');

    return {
      success: true,
      data: await getDatabaseStatsData(),
    };
  } catch {
    return internalErrorResult('Failed to load database statistics');
  }
}

export async function getSystemInfoAction(): Promise<ActionResult<SystemInfo>> {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorizedErrorResult('Requires admin privileges');

    return {
      success: true,
      data: await getSystemInfoData(),
    };
  } catch {
    return internalErrorResult('Failed to load system information');
  }
}

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ActionResult<{ changed: true; message: string }>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) return unauthorizedErrorResult();

    const validationResult = changePasswordSchema.safeParse(
      sanitizeApiInput(input as unknown as Record<string, unknown>)
    );

    if (!validationResult.success) {
      return validationErrorResult(
        'Password input is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    return {
      success: true,
      data: await changePasswordData(session.user.id, validationResult.data),
    };
  } catch (error) {
    // A wrong current password is normal user input, not a system fault — say so
    // instead of collapsing every failure into "Failed to change password".
    if (error instanceof PasswordChangeError) {
      return validationErrorResult(error.message, { currentPassword: [error.message] });
    }

    return internalErrorResult('Failed to change password');
  }
}

export async function getExportDataAction(): Promise<ActionResult<ExportData>> {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorizedErrorResult('Requires admin privileges');

    return {
      success: true,
      data: await getExportDataData(),
    };
  } catch {
    return internalErrorResult('Failed to export data');
  }
}

export async function listUserApiKeysAction(): Promise<ActionResult<UserApiKeySummary[]>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) return unauthorizedErrorResult();

    return {
      success: true,
      data: await listUserApiKeys(session.user.id),
    };
  } catch {
    return internalErrorResult('Failed to load API keys');
  }
}

export async function createUserApiKeyAction(input: {
  name: string;
}): Promise<ActionResult<CreatedUserApiKey>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) return unauthorizedErrorResult();

    const validationResult = createApiKeySchema.safeParse(
      sanitizeApiInput(input as unknown as Record<string, unknown>)
    );

    if (!validationResult.success) {
      return validationErrorResult(
        'API key input is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    return {
      success: true,
      data: await createUserApiKey(session.user.id, validationResult.data.name),
    };
  } catch {
    return internalErrorResult('Failed to create API key');
  }
}

export async function revokeUserApiKeyAction(input: {
  id: string;
}): Promise<ActionResult<boolean>> {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) return unauthorizedErrorResult();

    const validationResult = revokeApiKeySchema.safeParse(
      sanitizeApiInput(input as unknown as Record<string, unknown>)
    );

    if (!validationResult.success) {
      return validationErrorResult(
        'API key input is invalid',
        zodFieldErrors(validationResult.error)
      );
    }

    return {
      success: true,
      data: await revokeUserApiKey(session.user.id, validationResult.data.id),
    };
  } catch {
    return internalErrorResult('Failed to revoke API key');
  }
}
