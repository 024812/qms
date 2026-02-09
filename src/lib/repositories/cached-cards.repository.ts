/**
 * Cached Cards Repository
 *
 * Provides cached wrappers around CardRepository using Next.js 16's 'use cache' directive.
 *
 * Updated: Family-shared data model (no userId isolation)
 * - Use 'use cache' for shared data (not 'use cache: private')
 * - Use React's cache() for request deduplication
 */

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { cardRepository, type CardFilters } from './card.repository';
import { type Card } from '@/db/schema';

/**
 * Get a single card by ID with caching (family-shared)
 * Cache: 5 minutes
 * Tags: 'cards', 'card-{id}'
 */
export async function getCachedCardById(id: string): Promise<Card | null> {
  'use cache';
  cacheLife({
    stale: 60,
    revalidate: 300,
    expire: 3600,
  });
  cacheTag('cards', `card-${id}`);

  return cardRepository.findById(id);
}

/**
 * Get cards with filters and pagination (family-shared)
 * Cache: 2 minutes
 * Tags: 'cards', 'cards-list'
 */
export async function getCachedCards(
  filters: CardFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{
  items: Card[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  'use cache';
  cacheLife({
    stale: 30,
    revalidate: 120,
    expire: 600,
  });

  // Build cache tags
  const tags = ['cards', 'cards-list'];
  if (filters.sport) tags.push(`cards-sport-${filters.sport}`);
  if (filters.status) tags.push(`cards-status-${filters.status}`);
  cacheTag(...tags);

  const offset = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    cardRepository.findAll({ ...filters, limit: pageSize, offset }),
    cardRepository.count(filters),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get card statistics (family-shared)
 * Cache: 5 minutes
 * Tags: 'cards', 'cards-stats'
 */
export async function getCachedCardStats() {
  'use cache';
  cacheLife({
    stale: 60,
    revalidate: 300,
    expire: 3600,
  });
  cacheTag('cards', 'cards-stats');

  return cardRepository.getStats();
}

/**
 * React cache wrappers for request deduplication
 * Use these for additional request-level caching within a single render
 */
export const getCardByIdWithDedup = cache(getCachedCardById);
export const getCardsWithDedup = cache(getCachedCards);
export const getCardStatsWithDedup = cache(getCachedCardStats);
