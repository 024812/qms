import { getQuiltsAction } from '@/app/actions/quilts';
import { getAppSettingsAction } from '@/app/actions/settings';
import type { QuiltSortField, SortOrder } from '@/lib/data/quilts';
import type { QuiltSearchInput } from '@/types/quilt';
import type { FilterCriteria } from '@/components/quilts/AdvancedFilters';
import { QuiltsPageClient } from './_components/QuiltsPageClient';

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: RawSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseQuiltSearchParams(searchParams: RawSearchParams): {
  searchInput?: QuiltSearchInput;
  initialSearchTerm: string;
  initialFilters: FilterCriteria;
} {
  const season = getParam(searchParams, 'season');
  const status = getParam(searchParams, 'status');
  const location = getParam(searchParams, 'location');
  const brand = getParam(searchParams, 'brand');
  const search = getParam(searchParams, 'search');
  const limit = Math.min(parsePositiveInt(getParam(searchParams, 'limit'), 20), 100);
  const offset = parsePositiveInt(getParam(searchParams, 'offset'), 0);

  const sortByParam = getParam(searchParams, 'sortBy');
  const sortOrderParam = getParam(searchParams, 'sortOrder');

  const allowedSortBy: QuiltSortField[] = [
    'itemNumber',
    'name',
    'season',
    'weightGrams',
    'createdAt',
    'updatedAt',
  ];
  const sortBy = allowedSortBy.includes(sortByParam as QuiltSortField)
    ? (sortByParam as QuiltSortField)
    : 'itemNumber';
  const sortOrder: SortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';

  const initialFilters: FilterCriteria = {
    seasons: season ? [season] : [],
    statuses: status ? [status] : [],
    colors: [],
    materials: [],
  };

  const hasSearchInput = Boolean(
    season || status || location || brand || search || offset || limit || sortBy || sortOrder
  );
  const searchInput = hasSearchInput
    ? {
        filters: {
          ...(season
            ? { season: season as NonNullable<QuiltSearchInput['filters']>['season'] }
            : {}),
          ...(status
            ? { status: status as NonNullable<QuiltSearchInput['filters']>['status'] }
            : {}),
          ...(location ? { location } : {}),
          ...(brand ? { brand } : {}),
          ...(search ? { search } : {}),
        },
        sortBy,
        sortOrder,
        skip: offset,
        take: limit,
      }
    : undefined;

  return {
    searchInput,
    initialSearchTerm: search || '',
    initialFilters,
  };
}

export default async function QuiltsPage({
  searchParams,
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const { searchInput, initialSearchTerm, initialFilters } =
    parseQuiltSearchParams(resolvedSearchParams);

  const [quiltsResult, appSettingsResult] = await Promise.all([
    getQuiltsAction(searchInput),
    getAppSettingsAction(),
  ]);

  if (!quiltsResult.success) {
    throw new Error(quiltsResult.error.message);
  }

  const { quilts, total, hasMore } = quiltsResult.data;

  return (
    <QuiltsPageClient
      initialData={{
        quilts,
        total,
        hasMore,
      }}
      initialAppSettings={appSettingsResult.success ? appSettingsResult.data : null}
      initialSearchParams={searchInput}
      initialSearchTerm={initialSearchTerm}
      initialFilters={initialFilters}
    />
  );
}
