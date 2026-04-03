import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { and, asc, count, desc, eq, ilike, isNotNull, ne, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { cards, type Card, type NewCard } from '@/db/schema';
import { dbLogger } from '@/lib/logger';
import { cardsCacheTags } from '@/modules/cards/blueprint';
import type { CardItem } from '@/modules/cards/schema';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

export interface CardListInput {
  search?: string;
  filter?: {
    sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
    gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC';
    status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  };
  includeSold?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CardListResult {
  items: CardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SaveCardData {
  id?: string;
  userId?: string | null;
  playerName: string;
  sport: 'BASKETBALL' | 'SOCCER' | 'OTHER';
  team?: string | null;
  position?: string | null;
  year: number;
  brand: string;
  series?: string | null;
  cardNumber?: string | null;
  gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC' | null;
  grade?: number | null;
  certificationNumber?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  currentValue?: number | null;
  estimatedValue?: number | null;
  soldPrice?: number | null;
  soldDate?: string | null;
  valuationDate?: string | null;
  valuationConfidence?: string | null;
  valuationSources?: string[] | null;
  isAutographed?: boolean | null;
  hasMemorabilia?: boolean | null;
  memorabiliaType?: string | null;
  parallel?: string | null;
  serialNumber?: string | null;
  status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY' | null;
  location?: string | null;
  storageType?: string | null;
  condition?: string | null;
  notes?: string | null;
  mainImage?: string | null;
  frontImage?: string | null;
  backImage?: string | null;
  attachmentImages?: string[] | null;
}

export interface CardStats {
  totalCards: number;
  collectionCost: number;
  totalSpend: number;
  totalSold: number;
  totalProfit: number;
}

export interface MonthlyBuySellData {
  month: string;
  bought: number;
  sold: number;
}

export interface ActivityItem {
  id: string;
  type: 'added' | 'sold';
  playerName: string;
  date: string;
  amount: number;
  brand: string;
  year: number;
}

export interface CardSettingsData {
  azureOpenAIApiKey: string;
  azureOpenAIEndpoint: string;
  azureOpenAIDeployment: string;
  ebayAppId: string;
  ebayCertId: string;
  ebayDevId: string;
  rapidApiKey: string;
  tavilyApiKey: string;
}

export interface UpdateCardSettingsData {
  azureOpenAIApiKey: string;
  azureOpenAIEndpoint: string;
  azureOpenAIDeployment: string;
  ebayAppId: string;
  ebayCertId: string;
  ebayDevId: string;
  rapidApiKey: string;
  tavilyApiKey: string;
}

const VALID_SPORTS = ['BASKETBALL', 'SOCCER', 'OTHER'] as const;
const VALID_GRADING_COMPANIES = ['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC'] as const;
const VALID_CARD_STATUSES = ['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY'] as const;
type CardSortField =
  | 'itemNumber'
  | 'playerName'
  | 'year'
  | 'currentValue'
  | 'createdAt'
  | 'updatedAt';
type SortOrder = 'asc' | 'desc';

interface CardQueryFilters {
  search?: string;
  sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
  gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC';
  status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  excludeSold?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

function logCardDataError(message: string, error: unknown, meta?: Record<string, unknown>) {
  if (error instanceof Error) {
    dbLogger.error(message, error, meta);
    return;
  }

  dbLogger.error(message, undefined, {
    ...meta,
    ...(error !== undefined ? { error } : {}),
  });
}

function normalizeEnumValue<const TAllowed extends readonly string[]>(
  value: unknown,
  allowed: TAllowed,
  fallback: TAllowed[number]
): TAllowed[number] {
  return typeof value === 'string' && allowed.includes(value) ? value : fallback;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

function normalizeStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      if (value.trim() !== '') {
        return [value];
      }
    }
  }

  return null;
}

function normalizeCardItem(card: unknown): CardItem {
  const raw = card as Record<string, unknown>;
  const createdAt = normalizeDate(raw.createdAt) ?? new Date();
  const updatedAt = normalizeDate(raw.updatedAt) ?? createdAt;

  return {
    id: String(raw.id ?? ''),
    type: 'card',
    createdAt,
    updatedAt,
    itemNumber: normalizeNumber(raw.itemNumber) ?? 0,
    playerName: String(raw.playerName ?? ''),
    sport: normalizeEnumValue(raw.sport, VALID_SPORTS, 'OTHER'),
    team: normalizeString(raw.team),
    position: normalizeString(raw.position),
    year: normalizeNumber(raw.year) ?? 0,
    brand: String(raw.brand ?? ''),
    series: normalizeString(raw.series),
    cardNumber: normalizeString(raw.cardNumber),
    gradingCompany: normalizeEnumValue(raw.gradingCompany, VALID_GRADING_COMPANIES, 'UNGRADED'),
    grade: normalizeNumber(raw.grade),
    certificationNumber: normalizeString(raw.certificationNumber),
    purchasePrice: normalizeNumber(raw.purchasePrice),
    purchaseDate: normalizeDate(raw.purchaseDate),
    currentValue: normalizeNumber(raw.currentValue),
    estimatedValue: normalizeNumber(raw.estimatedValue),
    lastValueUpdate: normalizeDate(raw.lastValueUpdate ?? raw.valuationDate),
    soldPrice: normalizeNumber(raw.soldPrice),
    soldDate: normalizeDate(raw.soldDate),
    parallel: normalizeString(raw.parallel),
    serialNumber: normalizeString(raw.serialNumber),
    isAutographed: normalizeBoolean(raw.isAutographed),
    hasMemorabilia: normalizeBoolean(raw.hasMemorabilia),
    memorabiliaType: normalizeString(raw.memorabiliaType),
    status: normalizeEnumValue(raw.status, VALID_CARD_STATUSES, 'COLLECTION'),
    location: normalizeString(raw.location),
    storageType: normalizeString(raw.storageType),
    condition: normalizeString(raw.condition),
    notes: normalizeString(raw.notes),
    tags: normalizeStringArray(raw.tags),
    mainImage: normalizeString(raw.mainImage),
    attachmentImages: normalizeStringArray(raw.attachmentImages),
  };
}

function cleanNumericToString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return typeof numericValue === 'number' && Number.isFinite(numericValue)
    ? String(numericValue)
    : null;
}

function toCardQueryFilters(input: CardListInput): CardQueryFilters {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, input.pageSize ?? 20);

  return {
    search: input.search,
    excludeSold: input.includeSold === true ? false : !input.filter?.status,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    ...(input.filter?.sport ? { sport: input.filter.sport } : {}),
    ...(input.filter?.gradingCompany ? { gradingCompany: input.filter.gradingCompany } : {}),
    ...(input.filter?.status
      ? {
          status: input.filter.status,
          excludeSold: false,
        }
      : {}),
  };
}

function buildWhereClause(filters: CardQueryFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.excludeSold !== false && !filters.status) {
    conditions.push(ne(cards.status, 'SOLD'));
  }

  if (filters.status) {
    conditions.push(eq(cards.status, filters.status));
  }

  if (filters.sport) {
    conditions.push(eq(cards.sport, filters.sport));
  }

  if (filters.gradingCompany) {
    conditions.push(eq(cards.gradingCompany, filters.gradingCompany));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(cards.playerName, searchTerm),
        ilike(cards.brand, searchTerm),
        ilike(cards.team, searchTerm)
      ) ?? sql`false`
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

async function findCardRecordById(id: string): Promise<Card | null> {
  const result = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return result[0] ?? null;
}

async function findCardRecords(filters: CardQueryFilters): Promise<Card[]> {
  const whereClause = buildWhereClause(filters);
  const sortField = filters.sortBy ?? 'itemNumber';
  const sortOrder = filters.sortOrder ?? 'desc';
  const orderBy = sortOrder === 'asc' ? asc(cards[sortField]) : desc(cards[sortField]);

  let query = db.select().from(cards);

  if (whereClause) {
    query = query.where(whereClause) as typeof query;
  }

  query = query.orderBy(orderBy) as typeof query;

  if (typeof filters.limit === 'number') {
    query = query.limit(filters.limit) as typeof query;
  }

  if (typeof filters.offset === 'number') {
    query = query.offset(filters.offset) as typeof query;
  }

  return query;
}

async function countCardRecords(filters: CardQueryFilters): Promise<number> {
  const whereClause = buildWhereClause(filters);
  let query = db.select({ total: count() }).from(cards);

  if (whereClause) {
    query = query.where(whereClause) as typeof query;
  }

  const result = await query;
  return Number(result[0]?.total ?? 0);
}

async function createCardRecord(data: Partial<NewCard>): Promise<Card> {
  const result = await db
    .insert(cards)
    .values({
      ...data,
      gradingCompany: data.gradingCompany || 'UNGRADED',
      status: data.status || 'COLLECTION',
      grade: data.grade ?? null,
      isAutographed: data.isAutographed ?? false,
      hasMemorabilia: data.hasMemorabilia ?? false,
      attachmentImages: data.attachmentImages || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NewCard)
    .returning();

  dbLogger.info('Card created', { id: result[0].id, itemNumber: result[0].itemNumber });
  return result[0];
}

async function updateCardRecord(id: string, data: Partial<NewCard>): Promise<Card | null> {
  const result = await db
    .update(cards)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, id))
    .returning();

  if (result.length === 0) {
    dbLogger.warn('Card not found for update', { id });
    return null;
  }

  dbLogger.info('Card updated', { id });
  return result[0];
}

async function deleteCardRecord(id: string): Promise<boolean> {
  const result = await db.delete(cards).where(eq(cards.id, id)).returning({ id: cards.id });

  if (result.length === 0) {
    dbLogger.warn('Card not found for delete', { id });
    return false;
  }

  dbLogger.info('Card deleted', { id });
  return true;
}

function invalidateCardCaches(params: {
  id?: string;
  statuses?: Array<CardItem['status']>;
  sports?: Array<CardItem['sport']>;
}) {
  revalidateTag(cardsCacheTags.root, 'max');
  revalidateTag(cardsCacheTags.list, 'max');
  revalidateTag(cardsCacheTags.slice('overview', 'stats'), 'max');
  revalidateTag(cardsCacheTags.slice('overview', 'monthly'), 'max');
  revalidateTag(cardsCacheTags.slice('overview', 'activity'), 'max');

  if (params.id) {
    revalidateTag(cardsCacheTags.item(params.id), 'max');
  }

  for (const status of new Set(params.statuses ?? [])) {
    revalidateTag(cardsCacheTags.slice('status', status), 'max');
  }

  for (const sport of new Set(params.sports ?? [])) {
    revalidateTag(cardsCacheTags.slice('sport', sport), 'max');
  }
}

export async function getCardSettings(): Promise<CardSettingsData> {
  const [azureConfig, ebayConfig, rapidApiKey, tavilyApiKey] = await Promise.all([
    systemSettingsRepository.getAzureOpenAIConfig(),
    systemSettingsRepository.getEbayApiConfig(),
    systemSettingsRepository.getRapidApiKey(),
    systemSettingsRepository.getTavilyApiKey(),
  ]);

  return {
    azureOpenAIApiKey: azureConfig.apiKey || '',
    azureOpenAIEndpoint: azureConfig.endpoint || '',
    azureOpenAIDeployment: azureConfig.deployment || '',
    ebayAppId: ebayConfig.appId || '',
    ebayCertId: ebayConfig.certId || '',
    ebayDevId: ebayConfig.devId || '',
    rapidApiKey: rapidApiKey || '',
    tavilyApiKey: tavilyApiKey || '',
  };
}

export async function updateCardSettings(input: UpdateCardSettingsData): Promise<CardSettingsData> {
  return db.transaction(async tx => {
    await Promise.all([
      systemSettingsRepository.updateAzureOpenAIConfig(
        {
          apiKey: input.azureOpenAIApiKey,
          endpoint: input.azureOpenAIEndpoint,
          deployment: input.azureOpenAIDeployment,
        },
        tx
      ),
      systemSettingsRepository.updateEbayApiConfig(
        {
          appId: input.ebayAppId,
          certId: input.ebayCertId,
          devId: input.ebayDevId,
        },
        tx
      ),
      systemSettingsRepository.updateRapidApiKey(input.rapidApiKey, tx),
      systemSettingsRepository.updateTavilyApiKey(input.tavilyApiKey, tx),
    ]);

    const [azureConfig, ebayConfig, rapidApiKey, tavilyApiKey] = await Promise.all([
      systemSettingsRepository.getAzureOpenAIConfig(tx),
      systemSettingsRepository.getEbayApiConfig(tx),
      systemSettingsRepository.getRapidApiKey(tx),
      systemSettingsRepository.getTavilyApiKey(tx),
    ]);

    return {
      azureOpenAIApiKey: azureConfig.apiKey || '',
      azureOpenAIEndpoint: azureConfig.endpoint || '',
      azureOpenAIDeployment: azureConfig.deployment || '',
      ebayAppId: ebayConfig.appId || '',
      ebayCertId: ebayConfig.certId || '',
      ebayDevId: ebayConfig.devId || '',
      rapidApiKey: rapidApiKey || '',
      tavilyApiKey: tavilyApiKey || '',
    };
  });
}

export async function getCardById(id: string): Promise<CardItem | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag(cardsCacheTags.root, cardsCacheTags.item(id));

  try {
    const card = await findCardRecordById(id);
    return card ? normalizeCardItem(card) : null;
  } catch (error) {
    logCardDataError('Error fetching card by ID', error, { id });
    throw error;
  }
}

export async function getCards(input: CardListInput = {}): Promise<CardListResult> {
  'use cache';
  cacheLife('seconds');

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, input.pageSize ?? 20);
  const tags = [cardsCacheTags.root, cardsCacheTags.list];

  if (input.filter?.status) {
    tags.push(cardsCacheTags.slice('status', input.filter.status));
  }

  if (input.filter?.sport) {
    tags.push(cardsCacheTags.slice('sport', input.filter.sport));
  }

  cacheTag(...tags);

  try {
    const filters = toCardQueryFilters({ ...input, page, pageSize });
    const [items, total] = await Promise.all([findCardRecords(filters), countCardRecords(filters)]);

    return {
      items: items.map(normalizeCardItem),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logCardDataError('Error fetching cards', error, { input });
    throw error;
  }
}

export async function saveCard(data: SaveCardData): Promise<CardItem> {
  try {
    const current = data.id ? await findCardRecordById(data.id) : null;

    const cleanData = {
      userId: data.id ? undefined : (data.userId ?? null),
      playerName: data.playerName,
      sport: data.sport,
      team: data.team || null,
      position: data.position || null,
      year: data.year,
      brand: data.brand,
      series: data.series || null,
      cardNumber: data.cardNumber || null,
      gradingCompany: data.gradingCompany || 'UNGRADED',
      grade: cleanNumericToString(data.grade),
      certificationNumber: data.certificationNumber || null,
      purchasePrice: cleanNumericToString(data.purchasePrice),
      purchaseDate: data.purchaseDate || null,
      currentValue: cleanNumericToString(data.currentValue),
      estimatedValue: cleanNumericToString(data.estimatedValue),
      soldPrice: cleanNumericToString(data.soldPrice),
      soldDate: data.soldDate || null,
      valuationDate: data.valuationDate ? new Date(data.valuationDate) : null,
      valuationConfidence: data.valuationConfidence || null,
      valuationSources: data.valuationSources ?? [],
      isAutographed: data.isAutographed || false,
      hasMemorabilia: data.hasMemorabilia || false,
      memorabiliaType: data.memorabiliaType || null,
      parallel: data.parallel || null,
      serialNumber: data.serialNumber || null,
      status: data.status || 'COLLECTION',
      location: data.location || null,
      storageType: data.storageType || null,
      condition: data.condition || null,
      notes: data.notes || null,
      mainImage: data.mainImage || data.frontImage || null,
      attachmentImages: data.attachmentImages || (data.backImage ? [data.backImage] : null),
    };

    const saved = data.id
      ? await updateCardRecord(data.id, cleanData)
      : await createCardRecord(cleanData);

    if (!saved) {
      throw new Error(data.id ? 'Card not found' : 'Failed to save card');
    }

    const normalized = normalizeCardItem(saved);

    invalidateCardCaches({
      id: normalized.id,
      statuses: [
        current ? normalizeCardItem(current).status : normalized.status,
        normalized.status,
      ],
      sports: [current ? normalizeCardItem(current).sport : normalized.sport, normalized.sport],
    });

    return normalized;
  } catch (error) {
    logCardDataError('Error saving card', error, {
      id: data.id,
      playerName: data.playerName,
      status: data.status,
      sport: data.sport,
    });
    throw error;
  }
}

export async function deleteCard(id: string): Promise<boolean> {
  try {
    const current = await findCardRecordById(id);
    const deleted = await deleteCardRecord(id);

    if (!deleted) {
      throw new Error('Card not found');
    }

    if (current) {
      const normalized = normalizeCardItem(current);
      invalidateCardCaches({
        id,
        statuses: [normalized.status],
        sports: [normalized.sport],
      });
    } else {
      invalidateCardCaches({ id });
    }

    return true;
  } catch (error) {
    logCardDataError('Error deleting card', error, { id });
    throw error;
  }
}

export async function getCardStats(): Promise<CardStats> {
  'use cache';
  cacheLife('seconds');
  cacheTag(cardsCacheTags.root, cardsCacheTags.slice('overview', 'stats'));

  const [stats] = await db
    .select({
      totalCards: count(),
      collectionCost: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${cards.status} <> 'SOLD' THEN COALESCE(${cards.purchasePrice}::numeric, 0)
              ELSE 0
            END
          ),
          0
        )
      `.mapWith(Number),
      totalSpend: sql<number>`
        COALESCE(SUM(COALESCE(${cards.purchasePrice}::numeric, 0)), 0)
      `.mapWith(Number),
      totalSold: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${cards.status} = 'SOLD' THEN COALESCE(${cards.soldPrice}::numeric, 0)
              ELSE 0
            END
          ),
          0
        )
      `.mapWith(Number),
      totalProfit: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${cards.status} = 'SOLD' THEN
                COALESCE(${cards.soldPrice}::numeric, 0) - COALESCE(${cards.purchasePrice}::numeric, 0)
              ELSE 0
            END
          ),
          0
        )
      `.mapWith(Number),
    })
    .from(cards);

  return {
    totalCards: Number(stats?.totalCards ?? 0),
    collectionCost: Number(stats?.collectionCost ?? 0),
    totalSpend: Number(stats?.totalSpend ?? 0),
    totalSold: Number(stats?.totalSold ?? 0),
    totalProfit: Number(stats?.totalProfit ?? 0),
  };
}

export async function getMonthlyBuySellData(): Promise<MonthlyBuySellData[]> {
  'use cache';
  cacheLife('seconds');
  cacheTag(cardsCacheTags.root, cardsCacheTags.slice('overview', 'monthly'));

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const months: MonthlyBuySellData[] = [];

  const [purchaseRows, soldRows] = await Promise.all([
    db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${cards.purchaseDate}::timestamp), 'YYYY-MM')`,
        total: sql<number>`
          COALESCE(SUM(COALESCE(${cards.purchasePrice}::numeric, 0)), 0)
        `.mapWith(Number),
      })
      .from(cards)
      .where(and(isNotNull(cards.purchaseDate), sql`${cards.purchaseDate} >= ${windowStart}`))
      .groupBy(sql`DATE_TRUNC('month', ${cards.purchaseDate}::timestamp)`),
    db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${cards.soldDate}::timestamp), 'YYYY-MM')`,
        total: sql<number>`
          COALESCE(SUM(COALESCE(${cards.soldPrice}::numeric, 0)), 0)
        `.mapWith(Number),
      })
      .from(cards)
      .where(
        and(
          eq(cards.status, 'SOLD'),
          isNotNull(cards.soldDate),
          sql`${cards.soldDate} >= ${windowStart}`
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${cards.soldDate}::timestamp)`),
  ]);

  const purchasesByMonth = new Map(purchaseRows.map(row => [row.month, row.total]));
  const soldByMonth = new Map(soldRows.map(row => [row.month, row.total]));

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    months.push({
      month,
      bought: purchasesByMonth.get(month) ?? 0,
      sold: soldByMonth.get(month) ?? 0,
    });
  }

  return months;
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  'use cache';
  cacheLife('seconds');
  cacheTag(cardsCacheTags.root, cardsCacheTags.slice('overview', 'activity'));

  const [recentAdded, recentSold] = await Promise.all([
    db
      .select({
        id: cards.id,
        playerName: cards.playerName,
        date: cards.createdAt,
        amount: cards.purchasePrice,
        brand: cards.brand,
        year: cards.year,
      })
      .from(cards)
      .orderBy(desc(cards.createdAt))
      .limit(limit),
    db
      .select({
        id: cards.id,
        playerName: cards.playerName,
        date: cards.soldDate,
        amount: cards.soldPrice,
        brand: cards.brand,
        year: cards.year,
      })
      .from(cards)
      .where(and(eq(cards.status, 'SOLD'), isNotNull(cards.soldDate)))
      .orderBy(desc(cards.soldDate))
      .limit(limit),
  ]);

  const activities: ActivityItem[] = [
    ...recentAdded.map(card => ({
      id: `add-${card.id}`,
      type: 'added' as const,
      playerName: card.playerName,
      date: card.date.toISOString(),
      amount: Number(card.amount) || 0,
      brand: card.brand,
      year: card.year,
    })),
    ...recentSold
      .filter((card): card is typeof card & { date: string } => card.date !== null)
      .map(card => ({
        id: `sold-${card.id}`,
        type: 'sold' as const,
        playerName: card.playerName,
        date: new Date(card.date).toISOString(),
        amount: Number(card.amount) || 0,
        brand: card.brand,
        year: card.year,
      })),
  ];

  activities.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return activities.slice(0, limit);
}
