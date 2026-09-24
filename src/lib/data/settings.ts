import packageJson from '../../../package.json';

import { countQuilts } from '@/lib/data/quilts';
import { getSimpleUsageStats } from '@/lib/data/stats';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';
import { authAccount, authSession, db, type Tx, users, quilts, usageRecords } from '@/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { settingsCacheTags } from '@/modules/core/cache-tags';

import type {
  AppSettings,
  ChangePasswordInput,
  DatabaseStats,
  ExportData,
  SystemInfo,
  UpdateAppSettingsInput,
} from '@/lib/types/settings';

export async function getAppSettings(): Promise<AppSettings> {
  'use cache';
  cacheLife('moduleItem');
  cacheTag(settingsCacheTags.root, settingsCacheTags.slice('scope', 'app'));

  return readAppSettings();
}

async function readAppSettings(tx?: Tx): Promise<AppSettings> {
  const [appName, doubleClickAction, usageDoubleClickAction] = await Promise.all([
    systemSettingsRepository.getAppName(tx),
    systemSettingsRepository.getDoubleClickAction(tx),
    systemSettingsRepository.getUsageDoubleClickAction(tx),
  ]);

  return {
    appName,
    language: 'zh',
    itemsPerPage: 25,
    defaultView: 'list',
    doubleClickAction: (doubleClickAction as AppSettings['doubleClickAction']) || 'status',
    usageDoubleClickAction:
      (usageDoubleClickAction as AppSettings['usageDoubleClickAction']) || 'view',
  };
}

export async function updateAppSettings(input: UpdateAppSettingsInput): Promise<AppSettings> {
  const settings = await db.transaction(async tx => {
    if (input.appName !== undefined) {
      await systemSettingsRepository.updateAppName(input.appName, tx);
    }

    if (input.doubleClickAction !== undefined) {
      await systemSettingsRepository.updateDoubleClickAction(input.doubleClickAction, tx);
    }

    if (input.usageDoubleClickAction !== undefined) {
      await systemSettingsRepository.updateUsageDoubleClickAction(input.usageDoubleClickAction, tx);
    }

    return readAppSettings(tx);
  });

  revalidateTag(settingsCacheTags.root, 'max');
  revalidateTag(settingsCacheTags.slice('scope', 'app'), 'max');
  revalidateTag(settingsCacheTags.slice('scope', 'system-info'), 'max');

  return settings;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const [quiltCount, usageStats] = await Promise.all([countQuilts(), getSimpleUsageStats()]);

  return {
    totalQuilts: quiltCount,
    totalUsageRecords: usageStats.total,
    activeUsage: usageStats.active,
    provider: 'Neon Serverless PostgreSQL (via Drizzle)',
    connected: true,
  };
}

export async function getSystemInfo(): Promise<SystemInfo> {
  'use cache';
  cacheLife('hours');
  cacheTag(settingsCacheTags.root, settingsCacheTags.slice('scope', 'system-info'));

  return {
    version: packageJson.version,
    framework: 'Next.js 16',
    deployment: 'Vercel',
    database: 'Neon PostgreSQL',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  };
}

/** Why a password change was refused. */
export type PasswordChangeFailure = 'not-configured' | 'incorrect-current';

/** Expected, user-correctable password-change rejection (not a system fault). */
export class PasswordChangeError extends Error {
  readonly reason: PasswordChangeFailure;

  constructor(reason: PasswordChangeFailure) {
    super(
      reason === 'incorrect-current'
        ? 'Current password is incorrect'
        : 'Password is not configured for this user'
    );
    this.name = 'PasswordChangeError';
    this.reason = reason;
  }
}

/**
 * Change a user's password and revoke their other sessions.
 *
 * The caller passes `userId` explicitly: resolving the session is the Action
 * layer's job (blueprint §6.1 — a DAL must not call `auth()`).
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<{ changed: true; message: string }> {
  const [account] = await db
    .select({ password: authAccount.password })
    .from(authAccount)
    .where(and(eq(authAccount.userId, userId), eq(authAccount.providerId, 'credential')))
    .limit(1);

  if (!account?.password) {
    throw new PasswordChangeError('not-configured');
  }

  const isValid = await verifyPassword(input.currentPassword, account.password);
  if (!isValid) {
    throw new PasswordChangeError('incorrect-current');
  }

  const newHash = await hashPassword(input.newPassword);

  await db.transaction(async tx => {
    await tx.delete(authSession).where(eq(authSession.userId, userId));
    await tx
      .update(authAccount)
      .set({ password: newHash, updatedAt: new Date() })
      .where(and(eq(authAccount.userId, userId), eq(authAccount.providerId, 'credential')));

    await tx
      .update(users)
      .set({ hashedPassword: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  });

  return {
    changed: true,
    message: 'Password changed successfully',
  };
}

export async function getExportData(): Promise<ExportData> {
  // Export the complete dataset from one snapshot, without UI pagination limits.
  return db.transaction(
    async tx => {
      const quiltRows = await tx.select().from(quilts);
      const usageRows = await tx.select().from(usageRecords);
      return {
        exportDate: new Date().toISOString(),
        quilts: quiltRows,
        usageRecords: usageRows,
      };
    },
    { isolationLevel: 'repeatable read', accessMode: 'read only' }
  );
}
