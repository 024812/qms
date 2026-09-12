import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getAntiquesAction } from '@/app/actions/antiques';
import { AntiquesPageClient } from './_components/AntiquesPageClient';
import type { AntiqueCategory, AntiqueStatus } from '@/modules/antiques/schema';

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

const ANTIQUE_CATEGORIES = [
  'JADE',
  'WOOD',
  'CERAMIC',
  'METAL',
  'STONE',
  'PAPER',
  'TOOL',
  'OTHER',
] as const;

const ANTIQUE_STATUSES = ['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'APPRAISAL'] as const;

const ALLOWED_SORT_FIELDS = [
  'itemNumber',
  'name',
  'category',
  'currentValue',
  'createdAt',
  'updatedAt',
] as const;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

function pickEnum<T extends readonly string[]>(
  allowed: T,
  value: string | undefined
): T[number] | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T[number]) : undefined;
}

export default async function AntiquesPage({ params, searchParams }: PageProps) {
  requirePageModuleAccess(await auth(), 'antiques');

  await params;
  const resolvedSearchParams = await searchParams;

  // Parse query parameters
  const page = parsePositiveInt(resolvedSearchParams.page, 1);
  const pageSize = Math.min(parsePositiveInt(resolvedSearchParams.pageSize, 24), 100);
  const search = resolvedSearchParams.search || undefined;
  const category = pickEnum(ANTIQUE_CATEGORIES, resolvedSearchParams.category);
  const status = pickEnum(ANTIQUE_STATUSES, resolvedSearchParams.status);
  const era = resolvedSearchParams.era || undefined;
  const dynasty = resolvedSearchParams.dynasty || undefined;

  // Parse sort parameter (format: "field.order", e.g., "createdAt.desc")
  const sortParam = resolvedSearchParams.sort || 'itemNumber.desc';
  const [sortFieldRaw, sortOrderRaw] = sortParam.split('.');
  const sortBy = pickEnum(ALLOWED_SORT_FIELDS, sortFieldRaw) ?? 'itemNumber';
  const sortOrder = sortOrderRaw === 'asc' ? ('asc' as const) : ('desc' as const);

  const offset = (page - 1) * pageSize;

  // Fetch data through the actions layer
  const result = await getAntiquesAction({
    search,
    category: category as AntiqueCategory | undefined,
    status: status as AntiqueStatus | undefined,
    era,
    dynasty,
    limit: pageSize,
    offset,
    sortBy,
    sortOrder,
  });

  if (!result.success) {
    throw new Error(result.error.message);
  }

  const { antiques, total } = result.data;

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
