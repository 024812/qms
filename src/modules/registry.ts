/**
 * Module Registry
 *
 * Global module registry using the Strategy Pattern.
 * Dynamically selects module configuration based on type field.
 *
 * Requirements: 1.1, 1.2
 *
 * The module *ID* vocabulary lives in `./module-ids` so that pure consumers do
 * not have to load this file — and with it every module's UI components. This
 * module re-exports that vocabulary to keep a single import surface for callers
 * that genuinely need the registry (i.e. `getModule` / `getAllModules`).
 */

import {
  MODULE_IDS,
  getModuleIds,
  isRegisteredModuleId,
  normalizeModuleIds,
  type RegisteredModuleId,
} from './module-ids';
import { quiltModule } from './quilts/config';
import { cardModule } from './cards/config';
import { spiritModule } from './spirits/config';
import { paddleModule } from './paddles/config';
import { antiqueModule } from './antiques/config';
import { mapsModule } from './maps/config';

export { MODULE_IDS, getModuleIds, isRegisteredModuleId, normalizeModuleIds };
export type { RegisteredModuleId };

export type RegisteredModule =
  | typeof quiltModule
  | typeof cardModule
  | typeof spiritModule
  | typeof paddleModule
  | typeof antiqueModule
  | typeof mapsModule;

/**
 * Global module registry
 * Uses Strategy Pattern to dynamically select module configuration by type
 */
export const MODULE_REGISTRY: Record<RegisteredModuleId, RegisteredModule> = {
  quilts: quiltModule,
  cards: cardModule,
  spirits: spiritModule,
  paddles: paddleModule,
  antiques: antiqueModule,
  maps: mapsModule,
};

/**
 * Get module configuration by type
 */
export function getModule(type: string): RegisteredModule | undefined {
  return isRegisteredModuleId(type) ? MODULE_REGISTRY[type] : undefined;
}

/**
 * Get all registered modules
 */
export function getAllModules(): RegisteredModule[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * Check if module exists
 */
export function hasModule(type: string): boolean {
  // `in` walks the prototype chain, so `hasModule('__proto__')`,
  // `hasModule('constructor')` and `hasModule('toString')` would all answer
  // `true`. Only own keys count as registered modules.
  return Object.hasOwn(MODULE_REGISTRY, type);
}
