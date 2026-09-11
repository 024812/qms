import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getAntiques, countAntiques } from '@/lib/data/antiques';
import { AntiquesPageClient } from './_components/AntiquesPageClient';
import type { AntiqueSortField, SortOrder } from '@/lib/data/antiques';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    category?: string;
    status?: string;
    era?: string;
    dynasty?: string;
    sort?: string;
  }>;
}

export default async function AntiquesPage({ params, searchParams }: PageProps) {
  const session = await auth();
  requirePageModuleAccess(session, 'antiques');

  await params;
  const resolvedSearchParams = await searchParams;

  // Parse query parameters
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = Math.min(parseInt(resolvedSearchParams.pageSize || '24', 10), 100);
  const search = resolvedSearchParams.search || undefined;
  const category = resolvedSearchParams.category || undefined;
  const status = resolvedSearchParams.status || undefined;
  const era = resolvedSearchParams.era || undefined;
  const dynasty = resolvedSearchParams.dynasty || undefined;

  // Parse sort parameter (format: "field.order", e.g., "createdAt.desc")
  const sortParam = resolvedSearchParams.sort || 'itemNumber.desc';
  const [sortField, sortOrder] = sortParam.split('.') as [AntiqueSortField, SortOrder];

  const offset = (page - 1) * pageSize;

  // Fetch data
  const [antiques, total] = await Promise.all([
    getAntiques({
      search,
      category: category as any,
      status: status as any,
      era,
      dynasty,
      limit: pageSize,
      offset,
      sortBy: sortField || 'itemNumber',
      sortOrder: sortOrder || 'desc',
    }),
    countAntiques({
      search,
      category: category as any,
      status: status as any,
      era,
      dynasty,
    }),
  ]);

  return (
    <AntiquesPageClient
      initialAntiques={antiques}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialSearch={search}
      initialCategory={category}
      initialStatus={status}
    />
  );
}
