import { getPaddlesAction } from '@/app/actions/paddles';
import type { PaddleSortField, SortOrder } from '@/lib/data/paddles';
import type { PaddleSearchInput } from '@/app/actions/paddles';
import { PaddlesPageClient } from './_components/PaddlesPageClient';
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

function parsePaddleSearchParams(searchParams: RawSearchParams): {
  searchInput?: PaddleSearchInput;
  initialSearchTerm: string;
} {
  const status = getParam(searchParams, 'status');
  const bladeBrand = getParam(searchParams, 'bladeBrand');
  const handleType = getParam(searchParams, 'handleType');
  const search = getParam(searchParams, 'search');
  const limit = Math.min(parsePositiveInt(getParam(searchParams, 'limit'), 20), 100);
  const offset = parsePositiveInt(getParam(searchParams, 'offset'), 0);

  const sortByParam = getParam(searchParams, 'sortBy');
  const sortOrderParam = getParam(searchParams, 'sortOrder');

  const allowedSortBy: PaddleSortField[] = [
    'itemNumber',
    'name',
    'bladeBrand',
    'bladeWeightG',
    'createdAt',
    'updatedAt',
  ];
  const sortBy = allowedSortBy.includes(sortByParam as PaddleSortField)
    ? (sortByParam as PaddleSortField)
    : 'itemNumber';
  const sortOrder: SortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';

  const hasSearchInput = Boolean(
    status || bladeBrand || handleType || search || offset || limit || sortBy || sortOrder
  );
  const searchInput = hasSearchInput
    ? {
        filters: {
          ...(status
            ? { status: status as NonNullable<PaddleSearchInput['filters']>['status'] }
            : {}),
          ...(bladeBrand ? { bladeBrand } : {}),
          ...(handleType
            ? { handleType: handleType as NonNullable<PaddleSearchInput['filters']>['handleType'] }
            : {}),
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

export default async function PaddlesPage({
  searchParams,
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  requirePageModuleAccess(await auth(), 'paddles');
  const { searchInput, initialSearchTerm } = parsePaddleSearchParams(resolvedSearchParams);

  const paddlesResult = await getPaddlesAction(searchInput);

  if (!paddlesResult.success) {
    throw new Error(paddlesResult.error.message);
  }

  const { paddles, total, hasMore } = paddlesResult.data;

  return (
    <PaddlesPageClient
      initialData={{
        paddles,
        total,
        hasMore,
      }}
      initialSearchParams={searchInput}
      initialSearchTerm={initialSearchTerm}
    />
  );
}
