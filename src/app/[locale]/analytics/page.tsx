import { connection } from 'next/server';

import { countQuilts, getQuilts } from '@/lib/data/quilts';
import { getAnalyticsData } from '@/lib/data/stats';
import { getUsageRecords } from '@/lib/data/usage';
import { calculateAllQuiltsUsageStats } from '@/lib/usage-statistics';
import { AnalyticsPageClient } from './_components/AnalyticsPageClient';

export default async function AnalyticsPage() {
  await connection();

  const [analyticsData, totalQuilts, usageRecords] = await Promise.all([
    getAnalyticsData(),
    countQuilts(),
    getUsageRecords(),
  ]);

  const quilts = totalQuilts
    ? await getQuilts({
        limit: totalQuilts,
        sortBy: 'itemNumber',
        sortOrder: 'asc',
      })
    : [];

  const usageStats = calculateAllQuiltsUsageStats(
    quilts.map(quilt => ({
      id: quilt.id,
      name: quilt.name,
      itemNumber: quilt.itemNumber,
      season: quilt.season,
    })),
    usageRecords.map(record => ({
      id: record.id,
      quiltId: record.quiltId,
      startDate: record.startDate,
      endDate: record.endDate,
    }))
  );

  return (
    <AnalyticsPageClient
      initialAnalytics={{
        overview: analyticsData.overview,
        statusDistribution: {
          IN_USE: analyticsData.statusDistribution.inUse,
          STORAGE: analyticsData.statusDistribution.storage,
          MAINTENANCE: analyticsData.statusDistribution.maintenance,
        },
        seasonDistribution: analyticsData.seasonDistribution,
        usageBySeason: analyticsData.usageBySeason,
        mostUsedQuilts: analyticsData.mostUsedQuilts,
        usageByYear: analyticsData.usageByYear.map(item => ({
          year: Number.parseInt(item.period, 10),
          count: item.count,
        })),
        usageByMonth: analyticsData.usageByMonth.map(item => ({
          month: item.period,
          count: item.count,
        })),
      }}
      initialUsageStats={usageStats}
    />
  );
}
