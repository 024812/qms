import {
  getAppSettingsAction,
  getDatabaseStatsAction,
  getSystemInfoAction,
} from '@/app/actions/settings';
import { getUserActiveModules } from '@/app/actions/modules';
import { connection } from 'next/server';

import { SettingsPageClient } from './_components/SettingsPageClient';

export default async function SettingsPage() {
  await connection();

  const [appSettingsResult, databaseStatsResult, systemInfoResult, activeModules] =
    await Promise.all([
      getAppSettingsAction(),
      getDatabaseStatsAction(),
      getSystemInfoAction(),
      getUserActiveModules().catch(() => []),
    ]);

  return (
    <SettingsPageClient
      initialAppSettings={appSettingsResult.success ? appSettingsResult.data : null}
      initialDatabaseStats={databaseStatsResult.success ? databaseStatsResult.data : null}
      initialSystemInfo={systemInfoResult.success ? systemInfoResult.data : null}
      initialActiveModules={activeModules}
    />
  );
}
