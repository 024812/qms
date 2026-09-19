/**
 * Canonical agent tool names.
 *
 * This is the single source of truth for the tool surface. Both the dispatcher
 * (`src/app/api/agent/tools/route.ts`) and the published OpenAPI document
 * (`src/app/api/agent/openapi.json/route.ts`) read from it, so the contract can
 * never advertise a tool the dispatcher rejects — or omit one it accepts.
 *
 * The dispatcher's `scopeByTool` is typed as `Record<AgentToolName, AgentScope>`,
 * so adding a name here is a compile error until it is given a required scope.
 *
 * Kept as a dependency-free leaf module (same rationale as `./scopes`).
 */

export const AGENT_TOOL_NAMES = [
  // quilts
  'quilts.search',
  'quilts.get',
  'quilts.create',
  'quilts.update',
  'quilts.changeStatus',
  // usage (part of the quilts domain)
  'usage.search',
  'usage.create',
  'usage.end',
  // cards
  'cards.search',
  'cards.get',
  'cards.create',
  'cards.update',
  // paddles
  'paddles.search',
  'paddles.get',
  'paddles.create',
  'paddles.update',
  // antiques
  'antiques.search',
  'antiques.get',
  'antiques.create',
  'antiques.update',
  // maps
  'maps.search',
  'maps.get',
  'maps.create',
  'maps.update',
  // spirits
  'spirits.search',
  'spirits.get',
  'spirits.create',
  'spirits.update',
  // settings
  'settings.read',
] as const;

export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];
