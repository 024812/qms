/**
 * Module Registry
 * 
 * Global module registry using the Strategy Pattern.
 * Dynamically selects module configuration based on type field.
 * 
 * Requirements: 1.1, 1.2
 */

import { ModuleDefinition } from './types';
import { quiltModule } from './quilts/config';
import { cardModule } from './cards/config';

/**
 * Global module registry
 * Uses Strategy Pattern to dynamically select module configuration by type
 */
export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  quilt: quiltModule,
  card: cardModule,
  // Future modules:
  // shoe: shoeModule,
  // racket: racketModule,
};

/**
 * Get module configuration by type
 */
export function getModule(type: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY[type];
}

/**
 * Get all registered modules
 */
export function getAllModules(): ModuleDefinition[] {
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
export function getModuleIds(): string[] {
  return Object.keys(MODULE_REGISTRY);
}
