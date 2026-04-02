import { getAppSettingsAction } from '@/app/actions/settings';
import { getSimpleUsageStats } from '@/lib/data/stats';
import { getUsageRecordsWithQuilts } from '@/lib/data/usage';
import { UsageTrackingPageClient } from './_components/UsageTrackingPageClient';

export default async function UsageTrackingPage() {
  const [stats, appSettingsResult] = await Promise.all([
    getSimpleUsageStats(),
    getAppSettingsAction(),
  ]);
  const usageHistory = stats.total ? await getUsageRecordsWithQuilts({ limit: stats.total }) : [];

  return (
    <UsageTrackingPageClient
      initialAppSettings={appSettingsResult.success ? appSettingsResult.data : null}
      initialStats={stats}
      initialUsageHistory={usageHistory.map(record => ({
        id: record.id,
        quiltId: record.quiltId,
        quiltName: record.quiltName || 'Unknown',
        itemNumber: record.itemNumber || 0,
        color: record.color || '',
        startedAt: record.startedAt.toISOString(),
        endedAt: record.endedAt ? record.endedAt.toISOString() : null,
        usageType: record.usageType,
        notes: record.notes,
        isActive: record.isActive,
        duration: record.duration,
      }))}
    />
  );
}
