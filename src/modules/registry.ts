/**
 * Module Registry
 *
 * Global module registry using the Strategy Pattern.
 * Dynamically selects module configuration based on type field.
 *
 * Requirements: 1.1, 1.2
 */

import { quiltModule } from './quilts/config';
import { cardModule } from './cards/config';

export const MODULE_IDS = ['quilts', 'cards'] as const;
export type RegisteredModuleId = (typeof MODULE_IDS)[number];
export type RegisteredModule = typeof quiltModule | typeof cardModule;

/**
 * Global module registry
 * Uses Strategy Pattern to dynamically select module configuration by type
 */
export const MODULE_REGISTRY: Record<RegisteredModuleId, RegisteredModule> = {
  quilts: quiltModule,
  cards: cardModule,
  // Future modules:
  // shoes: shoeModule,
  // rackets: racketModule,
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
  return type in MODULE_REGISTRY;
}

/**
 * Get module IDs
 */
export function isRegisteredModuleId(value: unknown): value is RegisteredModuleId {
  return typeof value === 'string' && MODULE_IDS.includes(value as RegisteredModuleId);
}

export function normalizeModuleIds(value: unknown): RegisteredModuleId[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRegisteredModuleId);
}

export function getModuleIds(): readonly RegisteredModuleId[] {
  return MODULE_IDS;
}
