import { Metadata } from 'next';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getSpirits } from '@/lib/data/spirits';
import { SpiritsPageClient } from './_components/SpiritsPageClient';
import type { SpiritFilters } from '@/lib/data/spirits';

export const metadata: Metadata = {
  title: '藏酒管理 - QMS',
  description: '管理珍藏烈酒、葡萄酒和其他酒类收藏',
};

interface SearchParams {
  page?: string;
  pageSize?: string;
  search?: string;
  spiritType?: string;
  status?: string;
  bottleStatus?: string;
  brand?: string;
  country?: string;
  region?: string;
  limitedEdition?: string;
  sort?: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function SpiritsPage({ params: _params, searchParams }: PageProps) {
  // Auth check
  const session = await auth();
  requirePageModuleAccess(session, 'spirits');

  // Parse search params
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page ?? '1', 10);
  const pageSize = Math.min(parseInt(resolvedParams.pageSize ?? '24', 10), 100);
  const offset = (page - 1) * pageSize;

  // Parse sort
  const sortParam = resolvedParams.sort ?? 'createdAt.desc';
  const [sortBy = 'createdAt', sortOrder = 'desc'] = sortParam.split('.') as [
    string,
    'asc' | 'desc',
  ];

  // Build filters
  const filters: SpiritFilters = {
    limit: pageSize,
    offset,
    sortBy: sortBy as SpiritFilters['sortBy'],
    sortOrder,
    ...(resolvedParams.search ? { search: resolvedParams.search } : {}),
    ...(resolvedParams.spiritType
      ? { spiritType: resolvedParams.spiritType as SpiritFilters['spiritType'] }
      : {}),
    ...(resolvedParams.status ? { status: resolvedParams.status as SpiritFilters['status'] } : {}),
    ...(resolvedParams.bottleStatus
      ? { bottleStatus: resolvedParams.bottleStatus as SpiritFilters['bottleStatus'] }
      : {}),
    ...(resolvedParams.brand ? { brand: resolvedParams.brand } : {}),
    ...(resolvedParams.country ? { country: resolvedParams.country } : {}),
    ...(resolvedParams.region ? { region: resolvedParams.region } : {}),
    ...(resolvedParams.limitedEdition
      ? { limitedEdition: resolvedParams.limitedEdition === 'true' }
      : {}),
  };

  // Fetch initial data
  const spirits = await getSpirits(filters);

  return (
    <SpiritsPageClient
      initialSpirits={spirits}
      initialFilters={{
        page,
        pageSize,
        search: resolvedParams.search,
        spiritType: resolvedParams.spiritType,
        status: resolvedParams.status,
        bottleStatus: resolvedParams.bottleStatus,
        brand: resolvedParams.brand,
        country: resolvedParams.country,
        region: resolvedParams.region,
        limitedEdition: resolvedParams.limitedEdition,
        sort: sortParam,
      }}
    />
  );
}
