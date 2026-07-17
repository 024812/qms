import packageJson from '../../../package.json';

import { auth } from '@/auth';
import { countQuilts, getQuilts } from '@/lib/data/quilts';
import { getSimpleUsageStats } from '@/lib/data/stats';
import { getUsageRecords } from '@/lib/data/usage';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';
import { authAccount, authSession, db, type Tx, users } from '@/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { and, eq } from 'drizzle-orm';

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
  cacheLife('minutes');
  cacheTag('settings', 'settings-app');

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

  revalidateTag('settings', 'max');
  revalidateTag('settings-app', 'max');
  revalidateTag('settings-system-info', 'max');

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
  cacheTag('settings', 'settings-system-info');

  return {
    version: packageJson.version,
    framework: 'Next.js 16',
    deployment: 'Vercel',
    database: 'Neon PostgreSQL',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  };
}

export async function changePassword(
  input: ChangePasswordInput
): Promise<{ changed: true; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Please sign in first');
  }

  const [account] = await db
    .select({ password: authAccount.password })
    .from(authAccount)
    .where(and(eq(authAccount.userId, session.user.id), eq(authAccount.providerId, 'credential')))
    .limit(1);

  if (!account?.password) {
    throw new Error('Password is not configured for this user');
  }

  const isValid = await verifyPassword(input.currentPassword, account.password);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  const newHash = await hashPassword(input.newPassword);

  await db.transaction(async tx => {
    await tx.delete(authSession).where(eq(authSession.userId, session.user.id));
    await tx
      .update(authAccount)
      .set({ password: newHash, updatedAt: new Date() })
      .where(
        and(eq(authAccount.userId, session.user.id), eq(authAccount.providerId, 'credential'))
      );

    await tx
      .update(users)
      .set({ hashedPassword: newHash, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
  });

  return {
    changed: true,
    message: 'Password changed successfully',
  };
}

export async function getExportData(): Promise<ExportData> {
  const [quilts, usageRecords] = await Promise.all([getQuilts(), getUsageRecords()]);

  return {
    exportDate: new Date().toISOString(),
    quilts,
    usageRecords,
  };
}
