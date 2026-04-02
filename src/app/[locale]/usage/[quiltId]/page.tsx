import { getQuiltById } from '@/lib/data/quilts';
import { getUsageHistory } from '@/lib/data/usage';
import { QuiltUsageDetailPageClient } from './_components/QuiltUsageDetailPageClient';

type RawSearchParams = Record<string, string | string[] | undefined>;

interface QuiltUsageDetailPageProps {
  params: Promise<{
    locale: string;
    quiltId: string;
  }>;
  searchParams?: Promise<RawSearchParams>;
}

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function QuiltUsageDetailPage({
  params,
  searchParams,
}: QuiltUsageDetailPageProps) {
  const [{ quiltId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const from = getParam(resolvedSearchParams ?? {}, 'from') === 'quilts' ? 'quilts' : 'usage';

  const quilt = await getQuiltById(quiltId);
  const usageRecords = quilt ? await getUsageHistory(quiltId) : [];

  return <QuiltUsageDetailPageClient from={from} quilt={quilt} usageRecords={usageRecords} />;
}
