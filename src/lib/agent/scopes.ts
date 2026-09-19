/**
 * Agent scope vocabulary.
 *
 * This module is deliberately dependency-free (registry only, no DAL and no
 * database import) so that pure consumers — the OpenAPI document generator and
 * tests — can read the scope vocabulary without pulling in `@/db`.
 *
 * Scopes are *derived* from the module registry: registering a module in
 * `MODULE_IDS` automatically adds its `read:`/`write:` pair. Nothing in this
 * file needs editing when a module is added.
 */

import { MODULE_IDS, type RegisteredModuleId } from '@/modules/module-ids';

/** Scopes contributed by the module registry: one read/write pair per module. */
export type ModuleAgentScope = `read:${RegisteredModuleId}` | `write:${RegisteredModuleId}`;

/**
 * Cross-cutting scopes that do not map onto a single registry module.
 *
 * `admin:settings` is reserved for settings mutations. It is never granted to
 * members; admins reach it through the `*` wildcard.
 */
export type SystemAgentScope = 'read:usage' | 'write:usage' | 'read:settings' | 'admin:settings';

export type AgentScope = '*' | ModuleAgentScope | SystemAgentScope;

/** Every module-derived scope, in registry order. */
export const MODULE_AGENT_SCOPES: ModuleAgentScope[] = MODULE_IDS.flatMap(
  (id): ModuleAgentScope[] => [`read:${id}`, `write:${id}`]
);

/**
 * Extra scopes a module implies beyond its own `read:`/`write:` pair.
 * Quilt usage records live in the quilts domain, so `quilts` unlocks them too.
 */
export const MODULE_IMPLIED_SCOPES: Partial<Record<RegisteredModuleId, SystemAgentScope[]>> = {
  quilts: ['read:usage', 'write:usage'],
};

/**
 * Scopes available to every authenticated API-key holder, independent of the
 * modules they subscribe to.
 *
 * `read:settings` covers app-level preferences (app name, double-click action)
 * plus aggregate counters and runtime metadata — values already visible to any
 * signed-in user in the UI — so `settings.read` is deliberately not admin-only.
 */
export const BASE_AGENT_SCOPES: SystemAgentScope[] = ['read:settings'];

/**
 * The minimal shape `scopesForUser` needs. Declared structurally so this module
 * does not have to import a DAL (and therefore `@/db`).
 */
export interface AgentScopeSubject {
  role: 'admin' | 'member';
  /** Must already be registry-validated; see `normalizeModuleIds`. */
  activeModules: readonly RegisteredModuleId[];
}

/**
 * Derive the scope set for an API-key holder from the module registry.
 *
 * Iterating `MODULE_IDS` (rather than the subject's stored `activeModules`
 * order) makes the result deterministic and independent of how the array was
 * persisted. Unregistered IDs can never yield a scope.
 */
export function scopesForUser(user: AgentScopeSubject | null): AgentScope[] {
  if (!user) return [];
  if (user.role === 'admin') return ['*'];

  const active = new Set<RegisteredModuleId>(user.activeModules);
  const scopes = new Set<AgentScope>();

  for (const id of MODULE_IDS) {
    if (!active.has(id)) continue;
    scopes.add(`read:${id}`);
    scopes.add(`write:${id}`);
    for (const implied of MODULE_IMPLIED_SCOPES[id] ?? []) scopes.add(implied);
  }

  for (const base of BASE_AGENT_SCOPES) scopes.add(base);

  return [...scopes];
}
