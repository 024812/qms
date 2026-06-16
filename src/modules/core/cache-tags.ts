/**
 * Cache Tags Factory
 *
 * Provides a unified way to generate cache tags across all modules.
 * Ensures consistency and prevents typos in cache invalidation.
 *
 * Pattern:
 * - root: `module`
 * - list: `module:list`
 * - item: `module:item:{id}`
 * - slice: `module:{dimension}:{value}`
 *
 * Example:
 * ```ts
 * const quiltsTags = createModuleCacheTags('quilts');
 * cacheTag(quiltsTags.root, quiltsTags.list);
 * cacheTag(quiltsTags.item(id));
 * cacheTag(quiltsTags.slice('status', 'IN_USE'));
 * ```
 */

export interface ModuleCacheTags {
  /** Root tag for entire module: `module` */
  root: string;

  /** List tag: `module:list` */
  list: string;

  /** Item tag by ID: `module:item:{id}` */
  item: (id: string) => string;

  /** Slice tag by dimension and value: `module:{dimension}:{value}` */
  slice: (dimension: string, value: string) => string;
}

/**
 * Create standardized cache tags for a module
 *
 * @param module - Module name (e.g., 'quilts', 'cards', 'usage')
 * @returns Object with tag generators
 */
export function createModuleCacheTags(module: string): ModuleCacheTags {
  return {
    root: module,
    list: `${module}:list`,
    item: (id: string) => `${module}:item:${id}`,
    slice: (dimension: string, value: string) => `${module}:${dimension}:${value}`,
  };
}

/**
 * Pre-defined cache tags for core modules
 */
export const quiltsCacheTags = createModuleCacheTags('quilts');
export const cardsCacheTags = createModuleCacheTags('cards');
export const usageCacheTags = createModuleCacheTags('usage');
export const statsCacheTags = createModuleCacheTags('stats');

/**
 * Special cache tags for cross-module concerns
 */
export const globalCacheTags = {
  dashboard: 'dashboard',
  overview: (module: string) => `${module}:overview`,
  settings: (module: string) => `${module}:settings`,
} as const;
