/**
 * Module ID vocabulary — the canonical list of registered modules.
 *
 * This module is deliberately a leaf: it imports nothing. `registry.ts` layers
 * the module *implementations* (configs, UI components) on top of it, but pure
 * consumers — validation, agent scopes, user preferences, DALs — must import
 * from here.
 *
 * Why it matters: importing `MODULE_IDS` from `registry.ts` transitively loads
 * every module config, which imports that module's React components, which
 * import the App Router. That drags the whole UI graph into server-only and
 * test contexts, so pure consumers must not reach through the registry.
 */

export const MODULE_IDS = ['quilts', 'cards', 'spirits', 'paddles', 'antiques', 'maps'] as const;

export type RegisteredModuleId = (typeof MODULE_IDS)[number];

export function isRegisteredModuleId(value: unknown): value is RegisteredModuleId {
  return typeof value === 'string' && MODULE_IDS.includes(value as RegisteredModuleId);
}

/**
 * Keep only the values that still correspond to a registered module. Use this
 * whenever a module list arrives from persisted data, so a stale or hand-edited
 * value cannot grant access to a module that no longer exists.
 */
export function normalizeModuleIds(value: unknown): RegisteredModuleId[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRegisteredModuleId);
}

export function getModuleIds(): readonly RegisteredModuleId[] {
  return MODULE_IDS;
}
