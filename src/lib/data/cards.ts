import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { db } from '@/db';
import { cards } from '@/db/schema';
import { dbLogger } from '@/lib/logger';
import { cardRepository, type CardFilters } from '@/lib/repositories/card.repository';
import { cardsCacheTags } from '@/modules/cards/blueprint';
import type { CardItem } from '@/modules/cards/schema';

export interface CardListInput {
  search?: string;
  filter?: {
    sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
    gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC';
    status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  };
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

const VALID_SPORTS = ['BASKETBALL', 'SOCCER', 'OTHER'] as const;
const VALID_GRADING_COMPANIES = ['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC'] as const;
const VALID_CARD_STATUSES = ['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY'] as const;

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

function toRepositoryFilters(input: CardListInput): CardFilters {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, input.pageSize ?? 20);

  return {
    search: input.search,
    excludeSold: !input.filter?.status,
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

export async function getCardById(id: string): Promise<CardItem | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag(cardsCacheTags.root, cardsCacheTags.item(id));

  try {
    const card = await cardRepository.findById(id);
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
    const filters = toRepositoryFilters({ ...input, page, pageSize });
    const [items, total] = await Promise.all([
      cardRepository.findAll(filters),
      cardRepository.count(filters),
    ]);

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
    const current = data.id ? await cardRepository.findById(data.id) : null;

    const cleanData = {
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
      ? await cardRepository.update(data.id, cleanData)
      : await cardRepository.create(cleanData);

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
    const current = await cardRepository.findById(id);
    const deleted = await cardRepository.delete(id);

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

  const allCards = await db.select().from(cards);

  return allCards.reduce(
    (acc, card) => {
      const purchasePrice = Number(card.purchasePrice) || 0;
      const soldPrice = Number(card.soldPrice) || 0;
      const isSold = card.status === 'SOLD';

      acc.totalSpend += purchasePrice;

      if (!isSold) {
        acc.collectionCost += purchasePrice;
      }

      if (isSold) {
        acc.totalSold += soldPrice;
        acc.totalProfit += soldPrice - purchasePrice;
      }

      acc.totalCards += 1;
      return acc;
    },
    {
      totalCards: 0,
      collectionCost: 0,
      totalSpend: 0,
      totalSold: 0,
      totalProfit: 0,
    }
  );
}

export async function getMonthlyBuySellData(): Promise<MonthlyBuySellData[]> {
  'use cache';
  cacheLife('seconds');
  cacheTag(cardsCacheTags.root, cardsCacheTags.slice('overview', 'monthly'));

  const allCards = await db.select().from(cards);
  const now = new Date();
  const months: MonthlyBuySellData[] = [];

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;

    let bought = 0;
    let sold = 0;

    for (const card of allCards) {
      if (card.purchaseDate) {
        const purchaseDate = new Date(card.purchaseDate);
        if (purchaseDate.getFullYear() === year && purchaseDate.getMonth() === month) {
          bought += Number(card.purchasePrice) || 0;
        }
      }

      if (card.status === 'SOLD' && card.soldDate) {
        const soldDate = new Date(card.soldDate);
        if (soldDate.getFullYear() === year && soldDate.getMonth() === month) {
          sold += Number(card.soldPrice) || 0;
        }
      }
    }

    months.push({
      month: monthLabel,
      bought: Math.round(bought * 100) / 100,
      sold: Math.round(sold * 100) / 100,
    });
  }

  return months;
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  'use cache';
  cacheLife('seconds');
  cacheTag(cardsCacheTags.root, cardsCacheTags.slice('overview', 'activity'));

  const allCards = await db.select().from(cards);
  const activities: ActivityItem[] = [];

  for (const card of allCards) {
    activities.push({
      id: `add-${card.id}`,
      type: 'added',
      playerName: card.playerName,
      date: card.createdAt.toISOString(),
      amount: Number(card.purchasePrice) || 0,
      brand: card.brand,
      year: card.year,
    });

    if (card.status === 'SOLD' && card.soldDate) {
      activities.push({
        id: `sold-${card.id}`,
        type: 'sold',
        playerName: card.playerName,
        date: new Date(card.soldDate).toISOString(),
        amount: Number(card.soldPrice) || 0,
        brand: card.brand,
        year: card.year,
      });
    }
  }

  activities.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return activities.slice(0, limit);
}
