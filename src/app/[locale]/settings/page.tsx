import {
  getAppSettingsAction,
  getDatabaseStatsAction,
  listUserApiKeysAction,
  getSystemInfoAction,
} from '@/app/actions/settings';
import { getUserActiveModules } from '@/app/actions/modules';
import { connection } from 'next/server';

import { SettingsPageClient } from './_components/SettingsPageClient';

export default async function SettingsPage() {
  await connection();

  const [appSettingsResult, databaseStatsResult, systemInfoResult, apiKeysResult, activeModules] =
    await Promise.all([
      getAppSettingsAction(),
      getDatabaseStatsAction(),
      getSystemInfoAction(),
      listUserApiKeysAction(),
      getUserActiveModules().catch(() => []),
    ]);

  return (
    <SettingsPageClient
      initialAppSettings={appSettingsResult.success ? appSettingsResult.data : null}
      initialDatabaseStats={databaseStatsResult.success ? databaseStatsResult.data : null}
      initialSystemInfo={systemInfoResult.success ? systemInfoResult.data : null}
      initialApiKeys={apiKeysResult.success ? apiKeysResult.data : []}
      initialActiveModules={activeModules}
    />
  );
}
