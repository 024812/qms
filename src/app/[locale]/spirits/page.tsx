import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getSpiritsAction } from '@/app/actions/spirits';
import { SpiritsPageClient } from './_components/SpiritsPageClient';
import type { SpiritSearchInput } from '@/modules/spirits/schema';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spirits' });
  return {
    title: `${t('title')} - QMS`,
  };
}

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

const SPIRIT_TYPES = [
  'WHISKY',
  'COGNAC',
  'BRANDY',
  'RUM',
  'VODKA',
  'GIN',
  'TEQUILA',
  'BAIJIU',
  'WINE',
  'OTHER',
] as const;

const SPIRIT_STATUSES = ['COLLECTION', 'AGING', 'FOR_SALE', 'SOLD', 'OPENED', 'EMPTY'] as const;

const BOTTLE_STATUSES = ['SEALED', 'OPENED', 'EMPTY'] as const;

const ALLOWED_SORT_FIELDS = [
  'itemNumber',
  'name',
  'spiritType',
  'vintage',
  'age',
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

export default async function SpiritsPage({ searchParams }: PageProps) {
  // Auth check
  requirePageModuleAccess(await auth(), 'spirits');

  // Parse search params
  const resolvedParams = await searchParams;
  const page = parsePositiveInt(resolvedParams.page, 1);
  const pageSize = Math.min(parsePositiveInt(resolvedParams.pageSize, 24), 100);
  const offset = (page - 1) * pageSize;

  // Parse sort with whitelist
  const sortParam = resolvedParams.sort ?? 'createdAt.desc';
  const [sortByRaw, sortOrderRaw] = sortParam.split('.');
  const sortBy = pickEnum(ALLOWED_SORT_FIELDS, sortByRaw) ?? 'createdAt';
  const sortOrder = sortOrderRaw === 'asc' ? ('asc' as const) : ('desc' as const);

  const searchInput: SpiritSearchInput = {
    filters: {
      ...(resolvedParams.search ? { search: resolvedParams.search } : {}),
      ...(pickEnum(SPIRIT_TYPES, resolvedParams.spiritType)
        ? { spiritType: pickEnum(SPIRIT_TYPES, resolvedParams.spiritType) }
        : {}),
      ...(pickEnum(SPIRIT_STATUSES, resolvedParams.status)
        ? { status: pickEnum(SPIRIT_STATUSES, resolvedParams.status) }
        : {}),
      ...(pickEnum(BOTTLE_STATUSES, resolvedParams.bottleStatus)
        ? { bottleStatus: pickEnum(BOTTLE_STATUSES, resolvedParams.bottleStatus) }
        : {}),
      ...(resolvedParams.brand ? { brand: resolvedParams.brand } : {}),
      ...(resolvedParams.country ? { country: resolvedParams.country } : {}),
      ...(resolvedParams.region ? { region: resolvedParams.region } : {}),
      ...(resolvedParams.limitedEdition
        ? { limitedEdition: resolvedParams.limitedEdition === 'true' }
        : {}),
    },
    sortBy,
    sortOrder,
    skip: offset,
    take: pageSize,
  };

  // Fetch initial data through the actions layer
  const result = await getSpiritsAction(searchInput);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  const { spirits, total, hasMore } = result.data;

  return (
    <SpiritsPageClient
      initialSpirits={spirits}
      initialTotal={total}
      initialHasMore={hasMore}
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
