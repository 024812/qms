/**
 * Cached Quilt Repository
 *
 * Provides cached wrappers around QuiltRepository methods using React's cache function
 * and Next.js 16's 'use cache' directive for optimal performance.
 *
 * This approach follows Next.js 16 best practices:
 * - Use 'use cache' directive in standalone async functions
 * - Use React's cache() for request deduplication
 * - Avoid 'use cache' in class instance methods (not serializable)
 */

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { QuiltRepository, type QuiltFilters } from './quilt.repository';
import type { Quilt, QuiltStatus, Season } from '@/types/quilt';

// Singleton repository instance
const repository = new QuiltRepository();

/**
 * Find a quilt by ID with caching
 * Cache: 5 minutes
 * Tags: 'quilts', 'quilts-{id}'
 */
export async function getCachedQuiltById(id: string): Promise<Quilt | null> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('quilts', `quilts-${id}`);

  return repository.findById(id);
}

/**
 * Find all quilts with filters and caching
 * Cache: 2 minutes (120 seconds)
 * Tags: 'quilts', 'quilts-list', 'quilts-status-{status}', 'quilts-season-{season}'
 */
export async function getCachedQuilts(filters: QuiltFilters = {}): Promise<Quilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)

  // Build cache tags based on filters
  const tags = ['quilts', 'quilts-list'];
  if (filters.status) tags.push(`quilts-status-${filters.status}`);
  if (filters.season) tags.push(`quilts-season-${filters.season}`);
  cacheTag(...tags);

  return repository.findAll(filters);
}

/**
 * Find quilts by status with caching
 * Cache: 2 minutes (120 seconds)
 * Tags: 'quilts', 'quilts-status-{status}'
 */
export async function getCachedQuiltsByStatus(status: QuiltStatus): Promise<Quilt[]> {
  'use cache';
  cacheLife('seconds'); // 2 minutes (120 seconds)
  cacheTag('quilts', `quilts-status-${status}`);

  return repository.findByStatus(status);
}

/**
 * Find quilts by season with caching
 * Cache: 5 minutes
 * Tags: 'quilts', 'quilts-season-{season}'
 */
export async function getCachedQuiltsBySeason(season: Season): Promise<Quilt[]> {
  'use cache';
  cacheLife('minutes'); // 5 minutes
  cacheTag('quilts', `quilts-season-${season}`);

  return repository.findBySeason(season);
}

/**
 * React cache wrapper for request deduplication
 * Use this for additional request-level caching within a single render
 */
export const getQuiltByIdWithDedup = cache(getCachedQuiltById);
export const getQuiltsWithDedup = cache(getCachedQuilts);
export const getQuiltsByStatusWithDedup = cache(getCachedQuiltsByStatus);
export const getQuiltsBySeasonWithDedup = cache(getCachedQuiltsBySeason);
