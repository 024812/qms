import packageJson from '../../../package.json';

import { auth } from '@/auth';
import { countQuilts, getQuilts } from '@/lib/data/quilts';
import { getSimpleUsageStats } from '@/lib/data/stats';
import { getUsageRecords } from '@/lib/data/usage';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { cacheLife, cacheTag } from 'next/cache';

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

  const [appName, doubleClickAction, usageDoubleClickAction] = await Promise.all([
    systemSettingsRepository.getAppName(),
    systemSettingsRepository.getDoubleClickAction(),
    systemSettingsRepository.getUsageDoubleClickAction(),
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
  if (input.appName) {
    await systemSettingsRepository.updateAppName(input.appName);
  }

  if (input.doubleClickAction) {
    await systemSettingsRepository.updateDoubleClickAction(input.doubleClickAction);
  }

  if (input.usageDoubleClickAction) {
    await systemSettingsRepository.updateUsageDoubleClickAction(input.usageDoubleClickAction);
  }

  return getAppSettings();
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

  const userResult = await db.execute(sql`
    SELECT hashed_password FROM users WHERE id = ${session.user.id} LIMIT 1
  `);

  const user = userResult.rows[0] as { hashed_password: string | null } | undefined;

  if (!user?.hashed_password) {
    throw new Error('Password is not configured for this user');
  }

  const isValid = await verifyPassword(input.currentPassword, user.hashed_password);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  const newHash = await hashPassword(input.newPassword);

  await db.execute(sql`
    UPDATE users
    SET hashed_password = ${newHash}, updated_at = NOW()
    WHERE id = ${session.user.id}
  `);

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
