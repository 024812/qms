import { getMapsAction } from '@/app/actions/maps';
import type { MapFilters } from '@/lib/data/maps';
import type { MapType, MapStatus, MapMaterial } from '@/modules/maps/schema';
import { MapsPageClient } from './_components/MapsPageClient';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';

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

function parseMapSearchParams(searchParams: RawSearchParams): {
  searchInput?: {
    filters?: {
      mapType?: MapType;
      status?: MapStatus;
      material?: MapMaterial;
      region?: string;
      country?: string;
      search?: string;
    };
    sortBy?: MapFilters['sortBy'];
    sortOrder?: MapFilters['sortOrder'];
    skip?: number;
    take?: number;
  };
  initialSearchTerm: string;
} {
  const mapType = getParam(searchParams, 'mapType');
  const status = getParam(searchParams, 'status');
  const material = getParam(searchParams, 'material');
  const region = getParam(searchParams, 'region');
  const country = getParam(searchParams, 'country');
  const search = getParam(searchParams, 'search');
  const limit = Math.min(parsePositiveInt(getParam(searchParams, 'limit'), 20), 100);
  const offset = parsePositiveInt(getParam(searchParams, 'offset'), 0);

  const sortByParam = getParam(searchParams, 'sortBy');
  const sortOrderParam = getParam(searchParams, 'sortOrder');

  const allowedSortBy: NonNullable<MapFilters['sortBy']>[] = [
    'itemNumber',
    'name',
    'mapType',
    'publishedYear',
    'createdAt',
    'updatedAt',
  ];
  const sortBy = allowedSortBy.includes(sortByParam as NonNullable<MapFilters['sortBy']>)
    ? (sortByParam as NonNullable<MapFilters['sortBy']>)
    : 'itemNumber';
  const sortOrder: NonNullable<MapFilters['sortOrder']> =
    sortOrderParam === 'desc' ? 'desc' : 'asc';

  const hasSearchInput = Boolean(
    mapType ||
    status ||
    material ||
    region ||
    country ||
    search ||
    offset ||
    limit ||
    sortBy ||
    sortOrder
  );

  const searchInput = hasSearchInput
    ? {
        filters: {
          ...(mapType ? { mapType: mapType as MapType } : {}),
          ...(status ? { status: status as MapStatus } : {}),
          ...(material ? { material: material as MapMaterial } : {}),
          ...(region ? { region } : {}),
          ...(country ? { country } : {}),
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
  };
}

export default async function MapsPage({
  searchParams,
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  requirePageModuleAccess(await auth(), 'maps');

  const { searchInput, initialSearchTerm } = parseMapSearchParams(resolvedSearchParams);

  const mapsResult = await getMapsAction(searchInput);

  if (!mapsResult.success) {
    throw new Error(mapsResult.error.message);
  }

  const { maps, total, hasMore } = mapsResult.data;

  return (
    <MapsPageClient
      initialData={{
        maps,
        total,
        hasMore,
      }}
      initialSearchParams={searchInput}
      initialSearchTerm={initialSearchTerm}
    />
  );
}
