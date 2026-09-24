# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses npm-compatible date-based semantic versions in `YYYY.M.D` form.

## [Unreleased]

### Deployment

- Pin Node.js to `24.x` to prevent automatic major-version changes on Vercel.
- Declare version-specific npm install-script approvals for esbuild, Parcel watcher, SWC and unrs-resolver. ESLint 9 and esbuild-kit deprecation warnings remain upstream compatibility limitations.

### Fixed

- **Authorization gap on Server Pages.** `/analytics` and `/reports` read module data without any server-side module check, so an authenticated member without the `quilts` module could reach them by URL. Both now call `requirePageModuleAccess(session, 'quilts')`, matching the `requireApiModule('quilts')` check that `/api/analytics` already enforced. `GET /api/reports` was moved from `requireApiSession` to `requireApiModule('quilts')` so the API and the Web UI share one permission semantic.
- **Cache invalidation inside database transactions.** `src/lib/data/quilts.ts` called `revalidateTag` from within three `db.transaction` blocks. Because `revalidateTag` does not participate in rollback, a failed transaction could clear caches while leaving data unchanged. All quilt write paths now invalidate through a single post-commit helper, `invalidateQuiltWriteTags`, matching `usage.ts` and `settings.ts`.
- **Test suite excluded from type-checking.** `tsconfig.json` excluded `src/__tests__`, so the API, auth, and proxy test files were never checked by `tsc --noEmit`. The exclusion was removed.
- **Cross-field validation missing on the update path.** `createQuiltSchema` enforced the season/weight range and the length-to-width ratio while `updateQuiltSchema` enforced neither, so a record could be created legally and then PATCHed into a state that create itself rejects. Both schemas now share one rule function (`collectQuiltBusinessRuleIssues`), and `saveQuilt` re-checks the rules against the patch **merged onto the stored row** — a PATCH that changes only `season` is now validated against the stored `weightGrams`.
- **Lost updates on module subscription.** `subscribeToModule` / `unsubscribeFromModule` / `toggleModuleSubscription` read `preferences.activeModules`, computed the new array and wrote it back with no transaction, so two concurrent toggles could discard each other. The read-modify-write now runs in a transaction holding a `SELECT ... FOR UPDATE` row lock.
- **Case-sensitive search in three modules.** `paddles`, `antiques` and `maps` searched with a raw `LIKE` while `quilts` and `spirits` used `LOWER(...)`, so the same query matched in one module and missed in another. No module escaped `%` or `_`, so searching for `%` matched every row. All five now share `src/lib/data/search.ts`.
- **`listUsers` was cached but never invalidated.** It declares `cacheTag(usersCacheTags.*)` while `createUser`, `updateUser` and `deleteUser` performed no invalidation at all. All three now invalidate after their transaction commits.
- **`LOST` was a legal database status but an illegal API value.** `quilt_status` held four values while the Zod schema, the three Agent tool schemas and both i18n catalogues knew only three, and `docs/API_REFERENCE.md` documented `LOST` as a valid `?status=` filter — so the documented filter was rejected. `LOST` is now a first-class status everywhere: validation, Agent tools, OpenAPI, the analytics status distribution, every status badge and filter, and `messages/{en,zh}.json`. The runtime list `QUILT_STATUSES` is the single source the other points derive from, and `src/lib/__tests__/quilt-status-enum.test.ts` asserts that the Drizzle enum, the Zod enum, the constant and the two catalogues stay identical.
- **Business data was HTML-escaped before being persisted.** `sanitizeApiInput` ran `escapeHtml` on every string on the way into the database, so `A & B` was stored as `A &amp; B` and then rendered as `A &amp;amp; B` — and the same escaping corrupted exported CSV/JSON and Agent API reads. Input handling now normalises only (trim plus control-character stripping, keeping tabs and newlines); escaping is left to the renderer, which React already does for text nodes. `escapeHtml` remains exported but is documented as render-time-only. `sanitizeSearchQuery` no longer deletes `&`, `'`, `"`, `<` and `>` either, so searching `AT&T` no longer degrades to `ATT`.
- **New-module writes ran without transactions.** `updatePaddle`, `updateAntique`, `updateMap` and `updateSpirit` read the row and then wrote it back outside any transaction, so two concurrent writes could discard each other and a status-slice cache could be invalidated for a value that was never committed. All update and delete paths in `paddles`, `antiques`, `maps` and `spirits` now run inside `db.transaction` with a `SELECT ... FOR UPDATE` row lock, and invalidate through a post-commit `invalidate*WriteTags` helper.
- **The delete contract differed per module.** `deleteQuilt` resolved to `false` for a missing row while `deleteAntique`, `deleteMap`, `deleteSpirit` and `deleteCard` threw — and `deleteAntique`/`deleteMap`/`deleteSpirit` returned `Promise<void>`, so a caller could not tell "deleted" from "not found". All of them now resolve to `true` when a row was removed and `false` when there was nothing to remove, and never throw for "not found".
- **404-vs-500 decisions were made by comparing error messages.** The collection Actions branched on `error.message === 'Paddle not found'`, so rewording a DAL message silently turned every 404 into a 500, and a genuine fault that happened to carry the same wording was reported to the user as "not found". `src/lib/data/errors.ts` introduces `RecordNotFoundError` and `ConflictError` (both carrying `resource`), and the six collection Actions plus the Agent dispatcher now branch on `instanceof`.
- **Agent scopes never matched the published contract.** `scopesForUser` built its scope set from a hand-written per-module `if` chain, and `read:settings` was never granted to a non-admin — so the `settings.read` tool was effectively admin-only while `public/AGENT_API.md` and the OpenAPI document listed it as a normal read tool. Scope derivation now iterates the module registry, and `read:settings` is granted to every valid API key (it exposes app preferences, aggregate counters and runtime metadata — no secrets and no per-user data). `admin:settings` is reserved for settings mutations and is asserted never to reach a member.
- **`changePassword` resolved the session inside the DAL.** `src/lib/data/settings.ts` imported `auth` directly, which blueprint §6.1 forbids. It now takes `userId` explicitly and the Action layer resolves the session. The change also removed a second, inline implementation of the same operation: `src/app/api/settings/change-password/route.ts` talked to `@/db` on its own instead of reusing the DAL (blueprint §10.3).
- **Direct database access in `actions/auth.ts`.** Legacy user credential migration logic on first login was importing `@/db` directly in `src/app/actions/auth.ts`. This has been completely lowered into the user data access layer (`src/lib/data/users.ts` via `migrateLegacyUserToBetterAuth`), ensuring all 19 Server Actions in `src/app/actions` achieve 100% decoupling from direct `@/db` imports.
- **Unified REST API pagination.** Reconciled `GET /api/cards` and `GET /api/paddles` with the standard top-level `meta` pagination envelope used by `quilts`, `antiques`, `maps`, and `spirits`, while preserving backward compatibility with legacy client properties.
- **Removed empty obsolete component.** Cleaned up 0-byte residual file `src/components/quilts/QuiltUsageHistoryDialog.tsx`.
- **Health route database check.** `src/app/api/health/route.ts` now uses `checkDatabaseHealth()` exported from `@/db` instead of importing legacy `BaseRepositoryImpl`.
- **The Server Action result contract was re-implemented once per module.** Ten action modules each declared their own `ActionSuccess` / `ActionError` / `ActionResult` trio and their own error factories (~20 copies), `zodFieldErrors` existed four times with 28 inline `error.flatten().fieldErrors as Record<string, string[]>` casts beside it, and eleven hooks carried a byte-identical `unwrapActionResult`. The copies had drifted: `unauthorizedResult` in five modules versus `unauthorizedErrorResult` in the other five, `notFoundResult` next to `notFoundErrorResult`, `badRequestResult` next to `badRequestErrorResult`, and `dashboard.ts` / `cards.ts` omitted `fieldErrors` from the error shape entirely. Everything now imports from `src/lib/api/action-result.ts`. The wire contract is unchanged — `conflictErrorResult` still emits `ALREADY_EXISTS` (409), and the two admin-only callers still pass `'Requires admin privileges'` explicitly rather than the shared default being changed. `ActionError.code` is now `ActionErrorCode` instead of `string`, and `ACTION_ERROR_STATUS` is a total `Record<ActionErrorCode, number>`, so a new code cannot be emitted without a status (previously an unknown code silently became `500`).

- **`hasModule` answered `true` for prototype-chain keys.** It tested `type in MODULE_REGISTRY`, and `in` walks the prototype chain, so `hasModule('__proto__')`, `hasModule('constructor')` and `hasModule('toString')` all reported a registered module. It now uses `Object.hasOwn`. No production code called it, so the defect was latent — it was found by the new registry consistency test rather than by a user.

### Added

- `src/lib/data/search.ts` — shared case-insensitive search builder with `LIKE` wildcard escaping (`%`, `_`, `\`), now used by all five collection modules.
- `scripts/fix-html-escaped-text.ts` — one-off repair for values written before the escaping fix. Read-only by default (prints affected table/column counts plus samples) and needs an explicit `--apply` to write. It decodes exactly one entity level, so `&amp;lt;` becomes `&lt;` rather than `<`, and it deliberately leaves `updated_at` untouched.
- `src/lib/data/errors.ts` — `RecordNotFoundError` and `ConflictError`, so callers branch on the error type instead of matching on `error.message`.
- `src/modules/module-ids.ts` — the module-ID vocabulary (`MODULE_IDS`, `RegisteredModuleId`, `isRegisteredModuleId`, `normalizeModuleIds`) as a dependency-free leaf module. `src/modules/registry.ts` re-exports it unchanged, so the import surface is unchanged for callers that need the registry itself. Importing `MODULE_IDS` through the registry pulled in every module config, its React components and therefore the App Router; `src/lib/data/{users,user-api-keys}.ts` and `src/app/actions/{users,modules}.ts` now import the leaf instead, which also removed the need for `user-module-subscription.test.ts` to stub the registry — that stub had re-implemented the very normalisation it was supposed to be testing.
- `src/lib/agent/scopes.ts` — the agent scope vocabulary plus `scopesForUser`, kept free of DAL and database imports so the OpenAPI generator can read it.
- `src/lib/agent/tool-names.ts` — the canonical tool list. The dispatcher's Zod enum and the published OpenAPI `tool` enum both read it, so the contract cannot advertise a tool the endpoint rejects; `scopeByTool` is typed `Record<AgentToolName, AgentScope>`, which makes adding a tool a compile error until it is given a scope.
- `src/modules/core/ui/InteractiveCard.tsx` — renders a native `<button>` when `onClick` is present and a plain `<div>` otherwise. `PaddleCard`, `MapCard` and `SpiritCard` each hand-rolled `<div onClick role="button" tabIndex={0} onKeyDown>` plus Enter/Space handling; the native element supplies focus, keyboard activation and the correct role without any of it being re-implemented per module.
- `uniqueImageRefs()` in `src/lib/image-utils.ts` — de-duplicates image references in order. The attachment galleries in `AntiqueDetail`, `MapDetail` and `SpiritDetail` used ``key={`${img}-${idx}`}``; they now key on the reference itself, and de-duplicating first is what makes that key provably unique.
- Regression tests for the whole remediation cycle, `157` → `356` tests:
  - `src/lib/__tests__/quilt-status-enum.test.ts` (27) — DB/Zod/constant/i18n enum parity, plus status acceptance and rejection.
  - `src/lib/__tests__/quilt-business-rules.test.ts` (19) — the shared rule function, both schemas, and the merged-row re-check in `saveQuilt`.
  - `src/lib/__tests__/search.test.ts` (16) — compiles the generated SQL with `PgDialect` rather than asserting on strings.
  - `src/lib/__tests__/dal-delete-contract.test.ts` (12) — every delete resolves to a boolean and never throws for a missing row, plus the `RecordNotFoundError`/`ConflictError` contract.
  - `src/lib/__tests__/sanitization.test.ts` (3 → 12) — asserts text is stored verbatim and that rendering escapes it exactly once.
  - `src/lib/__tests__/user-module-subscription.test.ts` (9) — row lock, post-commit invalidation, and no-op writes, now against the real `normalizeModuleIds`.
  - `src/lib/__tests__/quilt-cache-invalidation.test.ts` (8) — including "does not invalidate any cache when the transaction fails".
  - `src/__tests__/page-module-authorization.test.ts` (8) — denial never reaches the DAL.
  - `src/__tests__/agent-auth.test.ts` (5 → 12) — the scope grant matrix, derived from `MODULE_IDS` so it cannot drift, plus "a member never receives an admin scope".
  - `src/__tests__/agent-openapi.test.ts` (1 → 6) — the published version matches `package.json`, `input` is optional, the idempotency-key length matches Zod, and the advertised tool list equals the dispatcher's.
  - `src/__tests__/action-error-mapping.test.ts` (7) — typed errors map to their codes, and a plain `Error` with the same wording does **not** become a 404.
  - `src/lib/__tests__/action-result.test.ts` (22) — the shared factories, the code → HTTP status map, `zodFieldErrors`, `unwrapActionResult` and `actionResultToApiResponse`, plus a source scan that fails if any action or hook re-declares the contract, a positive control proving the scan really matches something, and an assertion that `import { ..., type ActionResult, ... }` member lines are not mistaken for declarations.
  - `src/__tests__/module-registry-consistency.test.ts` (11) — registry keys equal `MODULE_IDS` and each config's own `id`; `getModule`/`hasModule` reject unknown ids **and `__proto__`**; every module carries the metadata the shell reads; every `module.icon` appears in the sidebar's `moduleIcons` map (otherwise it silently falls back to a default icon) and every module has an active-state `startsWith('/<id>')` check; `users.modules.<id>` and `navigation.<id>` exist for every module in both catalogues; and the two catalogues are key-for-key identical (`1672` keys each).
  - `src/lib/__tests__/new-module-dal-writes.test.ts` (24) — one table drives `maps` / `antiques` / `paddles` / `spirits` through the same six contracts: invalidation happens only after the transaction commits; update invalidates root, list and item; update invalidates **both the previous and the new value** of every changed dimension slice; a missing row raises `RecordNotFoundError` and invalidates nothing; a failed update or delete transaction invalidates nothing; create invalidates root, list and the created dimension slices.
  - `src/lib/__tests__/quilt-status-transition.test.ts` (9) — the only write path that touches two tables. Pins that the status update and the usage-record change go through the **same** transaction handle, that a missing quilt raises `RecordNotFoundError`, that a same-status write is a complete no-op, that a second `IN_USE` is rejected by `ConflictError` **before** the status write, that `STORAGE`/`MAINTENANCE` transitions never touch a usage record, and that the post-commit invalidation covers the item, both status slices, the stats and usage tags — with nothing invalidated when the transaction fails.
  - The registry test found a real latent defect: `hasModule` used `type in MODULE_REGISTRY`, and `in` walks the prototype chain, so `hasModule('__proto__')`, `hasModule('constructor')` and `hasModule('toString')` all answered `true`. It now uses `Object.hasOwn`. `hasModule` has no production callers, so the bug was latent rather than reachable.
- `src/lib/api/action-result.ts` — the single source of the Server Action result contract: `ActionResult<T>`, `ACTION_ERROR_CODES` with its total `ACTION_ERROR_STATUS` map, the seven error factories, `zodFieldErrors()` and `unwrapActionResult()`. `zod` is imported type-only, so the hooks can share `unwrapActionResult` without pulling zod into the client bundle. `src/lib/api/action-response.ts` now reuses the same type and status map instead of declaring its own `RouteActionResult` / `ActionErrorShape`.

### Changed

- `src/app/[locale]/reports/page.tsx` is now a Server Page with a private client shell (`_components/ReportsPageClient.tsx`), per blueprint §7.1. The client shell receives `isAdmin` as a prop instead of deciding permissions itself via `useSession()`.
- `src/app/actions/modules.ts` no longer imports `@/db` and no longer calls `revalidatePath`; its reads and writes moved to `src/lib/data/users.ts`, which owns the transaction, the row lock and the cache-tag invalidation. The action's return contract is unchanged, so no UI call site needed editing.
- **Cache profiles.** The built-in `cacheLife('seconds')` profile revalidates after **1 second** and `'minutes'` after **1 minute** — not the 2 and 5 minutes the DAL comments claimed. `next.config.ts` now defines `moduleList` (revalidate 2 minutes) and `moduleItem` (revalidate 5 minutes), and all 43 DAL call sites use them. Correctness is unaffected because every write path invalidates with `revalidateTag(..., 'max')`; the practical effect is a large reduction in Neon queries for list reads.
- `paddleSearchSchema` moved from the action into `src/modules/paddles/schema.ts` and now composes the existing `paddleFiltersSchema` instead of re-declaring the status and handle-type enums. Sortable columns are derived from one const tuple shared by the Zod enum and the DAL type.
- `getPaddlesAction` now sanitises its input, matching `getQuiltsAction`.
- `eslint.config.mjs` ignores `.next*` instead of `.next/**`. The documented local build workaround renames the stale build directory to `.next-stale-<epoch>`; without the wildcard, `npm run lint:check` walked thousands of generated files and reported ~145k problems.
- `src/app/api/settings/change-password/route.ts` is now a thin HTTP adapter over `changePassword()` and `requireApiSession()` instead of a second inline implementation that talked to `@/db` directly. `PasswordChangeError` maps to `400`.
- The Agent OpenAPI document reads `info.version` from `package.json` instead of a hard-coded string, no longer marks `input` as required (the Zod schema gives it a default), documents the `minLength: 8` that Zod already enforced on `idempotencyKey`, and publishes an `AgentScope` enum. `writeTools` is derived from `scopeByTool` rather than being a second hand-written list of the 15 mutating tools.
- `public/clear-cache.html` gained `<meta name="robots" content="noindex, nofollow">`, lost its `?clear=true` auto-trigger (a query parameter was enough to run a destructive action), and now asks for confirmation before clearing.

### Documentation

- `README.md` / `README_zh.md` now list the **resolved** `package-lock.json` versions (with the declared caret range in parentheses) instead of stale declared versions; the Chinese README gained the repository-layout, scripts, and release-verification sections it was missing.
- `docs/API_REFERENCE.md` corrected the response envelope: pagination lives at top-level `meta`, validation messages live at `error.details.errors` (not `error.fieldErrors`), and the three currently-divergent list payload shapes (`quilts` / `cards` / the four new modules) are now documented explicitly.
- `docs/architecture/MODULE_BLUEPRINT_V3.md` §15 baseline refreshed to `31` test files / `356` tests, and now records the local `next build` sandbox caveat plus eight standing rules: reuse the `moduleList`/`moduleItem` cache profiles, route search through `src/lib/data/search.ts`, give every module enum a single runtime list with a parity test, never HTML-escape before persisting, import the module-ID vocabulary from `src/modules/module-ids.ts` rather than through the registry, derive agent scopes from the registry while using `InteractiveCard` and `uniqueImageRefs` in module UI, keep the action-result contract (`src/lib/api/action-result.ts`) as its only declaration, and turn every "remember to do X for a new module" convention into a test — with a positive control, and without using `module` as a loop variable (`@next/next/no-assign-module-variable`).
- `docs/API_REFERENCE.md` now states what `LOST` means (a missing quilt, carrying no active usage record, like `STORAGE` and `MAINTENANCE`).
- `public/AGENT_API.md` gained a **Scopes** section documenting the derived scope model — including that `read:settings` is available to every valid API key and that `admin:settings` is reserved and never granted to members.
- Added `docs/reports/CODE_REVIEW_2026_09_18.md` — full-project review with verification results, P1/P2/P3 findings, an architecture-compliance matrix, and a fix log.
- `docs/README.md` index now links the review report and corrects the claim that every `/api/**` route is a compatibility surface (only `GET /api/quilts` sets `X-QMS-API-Surface: compatibility`).
- `README.md` / `README_zh.md` are now structurally symmetric — 26 headings each, line for line. The Chinese README was missing the "Optional Platform And Infrastructure" and "Optional Card AI And Data Providers" environment-variable groups entirely, and the English README nested `Agent API` under `Environment Variables` even though it is not an environment variable. Both now also document `AUTH_SECRET` as the optional fallback alias for `BETTER_AUTH_SECRET`.
- `.agent/skills/qms-module-development/SKILL.md` was rewritten against blueprint V3. Besides replacing a dead `file:///c:/Users/sli/...` link with repo-relative ones, its body still taught the architecture V3 deprecates: a `Repository` plus `cached-<module>.repository.ts` pair, inline `cacheLife({ stale, revalidate, expire })` instead of the named profiles, `<module>-actions.ts` instead of `<module>.ts`, `{ errors: { _form: [...] } }` instead of `ActionResult`, and NextAuth / TypeScript 5.9 instead of Better Auth / TypeScript 6. It now also warns that the legacy `createModuleCacheTags` in `src/modules/core/blueprint.ts` emits `module:<id>` tags while `src/modules/core/cache-tags.ts` emits `<module>` tags, so DALs must import the latter.

### Verification

- `npm audit --omit=optional` (`0` vulnerabilities)
- `npm run lint:check` (`0` errors, `0` warnings)
- `npm run type-check` (`0` errors, `src/__tests__` now included)
- `npm test` (`31` files / `356` tests)
- `npm run build` (isolated `C:\temp\qms-review-20260918` copy; `✓ Compiled successfully` + `Finished TypeScript` + `117/117` static pages)

## [2026.9.11] - 2026-09-11

### Changed

- Merged the architecture and security hardening release into `main`.
- Established API-first module development with a supported Web UI channel sharing the same schema, authorization, DAL, transactions, cache tags, and response contracts.
- Updated the active module blueprint for the upcoming `paddles`, `antiques`, `maps`, and `spirits` modules.

## [2026.7.17] - 2026-07-17

### Added

- Added administrator-only `.xlsx` Quilt import preview and confirmation APIs with validation, duplicate detection, and import summaries.
- Added PWA manifest metadata, production Service Worker registration, and static-asset-only caching.
- Added regression coverage for disabled registration, AI action authorization, image validation, Quilt import, and usage-date validation.

### Changed

- Bumped the date-based release version to `2026.7.17`.
- Organized documentation into `architecture`, `guides`, `reports`, and `archive` directories and repaired stale links.
- Documented the intentional household-shared business data model so per-user row isolation is not treated as a review defect.
- Bound Agent tool execution and audit attribution to the owning API key user's ID.
- Replaced the admin settings placeholder with a system health and management hub.
- Improved icon-button labels, language-switcher semantics, and analytics dark-mode colors.
- Updated compatible dependency releases while retaining ESLint 9 and TypeScript 6 until their parser/tooling ecosystem supports the next majors together.

### Security

- Disabled public registration in Better Auth, the authentication route, Server Actions, the registration page, and the proxy; accounts are now administrator-created only.
- Removed the tracked production environment file and added it to `.gitignore`.
- Added session checks and bounded inputs to legacy item actions, AI actions, NBA/weather endpoints, and compatibility APIs.
- Added rate limits, image and attachment size limits, request-body limits, session revocation, and sanitized API error responses.
- Removed production CSP `unsafe-eval` while preserving the current Cache Components-compatible script policy.

### Database

- Added and applied migration `0007_gifted_morlocks` to reconcile the Quilt item-number sequence and usage status data.
- Enforced one active usage record per Quilt with a partial unique index.
- Made Quilt status and usage-record create, update, end, and delete operations transactional.

### Fixed

- Rejected malformed JSON, invalid dates, inverted usage periods, unsafe image references, and oversized imports before they reach the data layer.
- Fixed locale detection, English/Chinese message-key drift, mobile zoom restrictions, and stale PWA caching behavior.
- Removed the unused public registration form and unsupported legacy `.xls` import claim.

### Verification

- `npm audit` (`0` vulnerabilities)
- `npm run format:check`
- `npm run lint:check`
- `npm run type-check`
- `npm test` (`139` tests)
- `npm run build` (isolated `C:\temp\qms-test-env` copy with non-sensitive build placeholders)
- `npm run db:generate` (no schema drift)
- `npm run db:migrate` (Neon migration `0007` applied)

## [2026.7.7] - 2026-07-07

### Added

- Added `CLAUDE.md` with build/test commands and the module blueprint architecture for future contributors.

### Changed

- Bumped release baseline to `2026.7.7` across `package.json`, docs, and deployment guides.
- Moved the dated `UPGRADE_REPORT_2026_06_16.md` out of the repository root into `docs/`.

### Security

- Hardened CSV formula-injection escaping in report exports to also neutralize leading-whitespace formula triggers.

### Fixed

- Restored tracked files that were incorrectly staged for deletion: `messages/en.json`, `messages/zh.json`, `drizzle/0006_agent_idempotency_keys.sql`, and `docs/guides/DATABASE_MIGRATIONS.md`.

### Verification

- `npm run type-check`
- `npm run build` (release-level, verified in an isolated build directory)

## [2026.7.3] - 2026-07-03

### Changed

- Updated the working stack to Next.js `16.2.10`, next-intl `4.13.1`, Better Auth `1.6.23`, Tailwind CSS `4.3.2`, TanStack React Query `5.101.2`, Vitest `4.1.9`, OpenAI `6.45.0`, Lucide React `1.23.0`, and Node types `26.1.0`.
- Restored tracked locale message files and changed next-intl request config to a static locale-message map for Turbopack-compatible builds.
- Updated Drizzle config to load `.env` and `.env.local`, with `.env.local` taking precedence for Neon deployments.
- Refreshed README and documentation around Neon-only migrations and the current release baseline.

### Security

- Added explicit session checks to dashboard, analytics, reports, NBA stats, and usage aggregate API routes.
- Added session checks to dashboard and usage server actions while preserving the family-shared data model.
- Added CSV formula-injection protection to report exports.
- Hardened SVG image handling by forcing attachment disposition.
- Added durable Agent write-tool idempotency with the `agent_idempotency_keys` table.
- Cleared `npm audit --omit=optional` to 0 known vulnerabilities.

### Database

- Added migration `0006_agent_idempotency_keys`.
- Added missing Drizzle journal entry for `0005_create_user_api_keys`.
- Baselined existing Neon migration records through `0005` and applied `0006` to Neon.

### Verification

- `npm run lint:check`
- `npm run type-check`
- `npm test`
- `npm run build`
- `npm audit --omit=optional`
- `npm run db:migrate`

## [2026.6.2] - 2026-06-02

### Changed

- Migrated authentication from Auth.js/NextAuth to Better Auth with Drizzle-backed auth tables.
- Updated runtime dependencies to the current working stack, including Next.js `16.2.7`, React `19.2.7`, TypeScript `6.0.3`, Better Auth `1.6.13`, Tailwind CSS `4.3.0`, and TanStack React Query `5.100.14`.
- Added a restricted Agent OpenAPI surface for OpenClaw or similar AI agents at `/api/agent/openapi.json` and `/api/agent/tools`.
- Updated environment variable documentation to use `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_BETTER_AUTH_URL`.

### Fixed

- Fixed Agent API key scope parsing so scopes containing colons, such as `read:quilts` and `write:cards`, are parsed correctly.
- Updated route-protection documentation to point to the current `src/proxy.ts` entry point.
- Replaced stale Auth.js/NextAuth references in active authentication, deployment, password migration, and security audit docs.

### Verification

- `npm audit`
- `npm run lint:check`
- `npm run type-check`
- `npm test`
- `npm run build`

## [2026.4.2] - 2026-04-02

### Changed

- Standardized `quilts` and `cards` around a copyable module blueprint pattern in:
  - `src/modules/core/blueprint.ts`
  - `src/modules/quilts/blueprint.ts`
  - `src/modules/cards/blueprint.ts`
- Locked module architecture around canonical data files in `src/lib/data/*.ts`, canonical server actions in `src/app/actions/*.ts`, and server-page-shell plus client-shell boundaries under `src/app/[locale]/**`.
- Continued moving internal module reads and writes away from legacy repository-first and REST-first paths.
- Updated README documentation to match the real production stack: Next.js 16.2, React 19.2, Auth.js v5, Drizzle ORM, Neon, React Query wrappers, and Vercel deployment.

### Fixed

- Stabilized settings and dashboard data flow so server and client state no longer drift across fallback code paths.
- Prevented build-time database noise on `/[locale]/settings` by forcing the page onto the proper runtime connection path.
- Cleared remaining lint and type debt in the current release baseline.

### Module Architecture

- Quilts now act as the first canonical module template with a single DAL, a single actions surface, server-first pages, and tag-based cache invalidation.
- Cards are aligned to the same model across list, detail, sold, overview, and settings flows.
- Internal application flows now treat route handlers primarily as compatibility surfaces instead of the main truth layer.

### Release

- Bumped version from `2026.2.21` to `2026.4.2`.
- Verified release baseline with:
  - `npm run lint:check`
  - `npm run type-check`
  - `npm run build`

## [2026.02.21] - 2026-02-21

### 🔄 Project Rebranding & Version Bump

- **Rebranding**
  - ✅ Updated browser tab title from "QMS - 家庭被子管理系统" to "QMS - 家庭物品管理系统"
  - ✅ Updated README.md and README_zh.md with new version and title
- **Version**
  - ✅ Bumped version to `2026.02.21` in package.json

## [2026.02.09] - 2026-02-09

### 🏗️ Cards Module Refactoring & Project Cleanup

- **Cards Module Migration to Family-Shared Data**
  - ✅ Created `CardRepository` class (320 lines) with full CRUD operations
  - ✅ Updated `cached-cards.repository.ts` to use `'use cache'` for shared data
  - ✅ Migrated `card-actions.ts` from `revalidatePath` to `revalidateTag`
  - ✅ Database migration: `cards.userId` now nullable with `ON DELETE SET NULL`
  - ✅ Added data isolation mode documentation to `MODULE_STANDARD.md`

- **Module Structure Compliance**
  - ✅ Added `quilts/[id]/page.tsx` detail page (Quilts compliance: 65% → 90%)
  - ✅ Added `cards/layout.tsx` module layout (Cards compliance: 90% → 95%)
  - ✅ Created `types.ts` files for both modules

- **Project Cleanup**
  - ✅ Deleted `docs/archive/` (8 checkpoint files)
  - ✅ Removed obsolete documentation (CLEANUP_COMPLETED.md, etc.)
  - ✅ Cleaned up 25 test/verify scripts from `scripts/`
  - ✅ Removed root-level temp files (design_system_output.md, etc.)

## [2026.02.02] - 2026-02-02

### 🃏 Trading Cards Module Production Release

- **Price Estimation & Smart Scan**
  - ✅ **Production Ready**: Enabled Production eBay API integration for real-time market data.
  - ✅ **Smart Scan**: Enhanced AI identification with locale-aware risk warnings (Chinese support).
  - ✅ **Valuation**: Restored "Estimate Price" button for manual valuation triggers.
- **Bug Fixes & Stability**
  - **Environment Fallback**: Added robust fallback to `.env` credentials if database settings are missing.
  - **Data Integrity**: Fixed URL corruption issue in System Settings API.
  - **Authentication**: Resolved eBay Client Credentials scope issues.
- **Cleanup**
  - Removed temporary debug scripts.
  - Updated project documentation.

## [2026.01.21] - 2026-01-21

### 🧹 Project Clean & Archival

- **Project Organization**
  - Archived all completed specs to `.kiro/specs/completed/`
  - Moved incomplete specs to `.kiro/specs/archived/`
  - Cleaned up project directory structure
  - Updated documentation
- **Version Management**
  - Bumped version to 2026.01.21
  - Updated README files (English & Chinese)
  - Consolidated release notes

## [2026.01.20] - 2026-01-20

### 👤 User Management & UI Enhancements

- **User Management System**
  - Complete CRUD operations for users (admin only)
  - Role-based access control (admin/member)
  - Module subscription management per user
  - Password management in users table
  - User creation with module assignments
- **UI/UX Improvements**
  - Beautiful welcome homepage with feature showcase
  - Sidebar auto-refresh after login
  - Module navigation improvements
  - Removed "Import/Export" from quilt module menu (moved to admin settings)
- **Sports Card Module**
  - Market data integration (eBay, PSA, Beckett, 130Point)
  - Value estimation algorithm
  - Card grading support
  - Image upload for cards

## [1.3.0] - 2026-01-13

### 🎨 UI Modernization

This release focuses on comprehensive UI modernization with shadcn/ui components and dark mode support.

#### Dark Mode Support

- **ThemeProvider**: Integrated next-themes for system-aware theme switching
- **ThemeToggle**: New component supporting light/dark/system modes
- **CSS Variables**: Complete dark mode color scheme using CSS custom properties
- **Component Updates**: All components updated to use CSS variables instead of hardcoded colors

#### shadcn Sidebar Migration

- **AppSidebar**: New sidebar component using shadcn/ui Sidebar primitives
- **SidebarRail**: Drag-to-collapse functionality
- **Keyboard Shortcuts**: Ctrl+B to toggle sidebar
- **Mobile Support**: Sheet-based sidebar on mobile devices

#### Command Palette

- **CommandPalette**: New Ctrl+K command palette for quick navigation
- **Quilt Search**: Search quilts by name, color, location
- **Page Navigation**: Quick access to all pages
- **Theme Switching**: Change theme from command palette

#### Navigation Improvements

- **Breadcrumb**: Auto-generated breadcrumb navigation based on route
- **AppHeader**: Redesigned header with breadcrumb, theme toggle, and command palette trigger

#### Accessibility

- **ARIA Labels**: shadcn components include built-in ARIA support
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Reduced Motion**: Respects prefers-reduced-motion media query
- **Color Contrast**: WCAG AA compliant color scheme

#### Components Updated for Dark Mode

- UsageCalendar, TemperatureDisplay, UsageTracker, UsageHistoryTable
- DashboardAlerts, SeasonalChart, RecentUsageList
- QuiltFilters, ErrorBoundary, ImportUpload, ImportResults
- WeatherForecast, WeatherWidget

## [1.2.0] - 2026-01-07

### 🔄 2026 Comprehensive Project Review

This release focuses on a comprehensive review and upgrade of the entire project, including dependency updates, code quality improvements, security enhancements, and UI/UX optimizations.

#### Dependency Upgrades

- **Next.js**: 16.0.7 → 16.1.1
- **React**: 19.2.1 → 19.2.3
- **TypeScript**: 5.6.3 → 5.9.3
- **Tailwind CSS**: 4.1.17 → 4.1.18
- **React Query**: 5.90.12 → 5.90.16
- **Framer Motion**: 12.23.25 → 12.24.7
- **Zod**: 4.1.13 → 4.3.5
- **Lucide React**: Updated to 0.562.0
- All other dependencies updated to latest stable versions

#### Code Quality Improvements

- ✅ Removed all unused imports and variables (ESLint no-unused-vars)
- ✅ Refactored duplicate code patterns into reusable functions
- ✅ Enhanced TypeScript type safety (zero type errors)
- ✅ Unified API response format with `createSuccessResponse` and `createErrorResponse`
- ✅ Ensured all API inputs use Zod validation
- ✅ Optimized database queries (COUNT queries instead of fetching all records)

#### Next.js 16 Best Practices

- ✅ Updated middleware to proxy naming convention (`src/proxy.ts`)
- ✅ Updated `next.config.js` with Turbopack configuration
- ✅ Verified all API routes follow Next.js 16 patterns

#### Security Enhancements

- ✅ Verified input sanitization using `sanitization.ts`
- ✅ Confirmed bcrypt configuration (salt rounds >= 10)
- ✅ Validated secure cookie settings (httpOnly=true, secure=true)
- ✅ Verified authentication and rate limiting
- ✅ Confirmed error responses don't leak sensitive information

#### UI/UX Improvements

- ✅ Applied design system color scheme (Trust Blue #2563EB)
- ✅ Verified hover states don't cause layout shift
- ✅ Replaced emojis with SVG icons (Lucide React)
- ✅ Optimized image loading with Next.js Image component
- ✅ Added `prefers-reduced-motion` support for accessibility
- ✅ Ran accessibility audit with axe-core

#### Repository Pattern

- ✅ Verified all database operations go through Repository classes
- ✅ Ensured all SQL uses parameterized queries (Neon sql template literal)

#### Project Structure

- ✅ Cleaned up empty directories
- ✅ Removed unused files
- ✅ Verified naming convention consistency

#### Internationalization

- ✅ Verified translation completeness (Chinese/English)
- ✅ Added missing translation keys

#### Documentation

- ✅ Updated README.md with new version and tech stack
- ✅ Updated README_zh.md to match English version
- ✅ Updated CHANGELOG.md with all changes
- ✅ Updated docs/INDEX.md with current architecture

## [1.1.0] - 2025-12-11

### 🏗️ Architecture Simplification

This release focuses on simplifying the project architecture and improving maintainability.

#### Version Management

- **Unified Version Number**: All version references now consistently show 1.1.0
- **Single Source of Truth**: Version is now read from package.json via REST API
- **New System Info API**: Created `/api/settings/system-info` endpoint
- **Settings Page Update**: Version display now fetches from API instead of hardcoded fallback

#### Completed Changes

- ✅ Removed tRPC framework, migrated to pure REST API + React Query
- ✅ Removed deprecated `executeQuery` function (SQL injection risk)
- ✅ Cleaned up notification system code
- ✅ Removed unused components and hooks
- ✅ Cleaned up temporary documentation files

#### Code Quality Improvements (Phase 3)

- **Removed Outdated Documentation**: Deleted `FRONTEND-TRPC-MIGRATION.md` and `TRPC-MUTATION-FIX.md`
- **Updated Code Comments**: Replaced tRPC references with "React Query" in 4 files
- **Fixed README.md**: Updated Backend API description to "Next.js API Routes (REST API)"
- **Optimized Dashboard API**: Changed from fetching all quilts to database-level COUNT queries
- **Updated Service Worker**: Changed tRPC endpoints to REST API endpoints in `public/sw.js`

### 📚 Documentation

- Updated README.md version to 1.1.0
- Updated README_zh.md version to 1.1.0
- Added architecture simplification changelog

## [1.0.1] - 2025-01-17

### 🐛 Bug Fixes

- Fixed quilt status change failure due to function signature mismatch
- Fixed double-click behavior not working in quilt management page
- Fixed usage detail page back button requiring two clicks
- Fixed notification query SQL parameter count mismatch
- Fixed duplicate close buttons in image viewer dialog
- Fixed misaligned action columns in quilt list view
- Fixed usage detail page unable to get quiltId parameter
- Added missing translations for quilts.form.notes and quilts.form.purchaseDate

### ✨ New Features

- **Quilt Image Viewer**
  - View main image and attachment images in full screen
  - Navigate between images with arrow keys or buttons
  - Thumbnail navigation bar for quick access
  - Support ESC key to close dialog
  - Display current image number and total count

- **Independent Usage Detail Page**
  - New route: `/usage/[quiltId]`
  - Display quilt information card with complete details
  - Show usage history table with temperature data
  - Smart back button (returns to source page based on `from` parameter)
  - Shareable direct links to specific quilt usage details

- **Purchase Date Field**
  - Added purchase date input in quilt add/edit form
  - Date picker with future date restriction
  - Properly loads and displays existing purchase dates
  - Optional field, not required

- **Data Backup & Restore**
  - Complete backup and restore documentation
  - PowerShell scripts for Windows (backup-database.ps1, restore-database.ps1)
  - Support for compressed backups
  - Automatic cleanup of old backups (keeps 30 most recent)
  - Pre-restore automatic backup for safety
  - npm scripts: `npm run backup`, `npm run backup:compress`, `npm run restore`

### 🔄 Refactoring

- **Simplified Usage Tracking Page**
  - Removed embedded detail view (176 lines of code removed)
  - All "view details" actions now navigate to independent detail page
  - Cleaner code structure, improved maintainability
  - Consistent user experience across the application
  - Code reduced from 466 lines to 290 lines (38% reduction)

### 📚 Documentation

- Added comprehensive backup and restore guide (BACKUP_RESTORE_GUIDE.md)
- Added quick start guide for backups (BACKUP_QUICK_START.md)
- Updated README with new features

### 🎯 Improvements

- All quilts now show image view button for consistent UI alignment
- Improved navigation flow: only one click needed to return from detail pages
- Better URL structure for usage details
- Enhanced user experience with clearer navigation paths

## [1.0.0] - 2025-01-11

### 🎉 First Stable Release

This is the first stable release of the Quilt Management System (QMS)!

### Added

- **UI Unification**
  - Migrated all pages to Shadcn UI component library
  - Unified table styles across all pages (header colors, sorting icons, action columns)
  - Created reusable error alert component
  - Standardized card padding (p-4 for stats, p-6 for content)
  - Improved empty state displays

- **Quilt Management Enhancements**
  - Componentized quilt table row for better maintainability
  - View usage history button (eye icon) in action column
  - Direct navigation to usage tracking page with quilt details
  - Fixed duplicate History icons in action column

- **Analytics Page Reorganization**
  - Split data overview into 4 focused tabs:
    - Data Overview (基础统计)
    - Status Distribution (状态分布)
    - Usage Rankings (使用排行)
    - Usage Frequency Analysis (使用频率分析)
  - Better data organization and navigation

- **Documentation**
  - Created comprehensive docs directory structure
  - Added PROJECT_SUMMARY.md with complete project overview
  - Added NEXT_STEPS.md for future development roadmap
  - Updated README with latest features

### Changed

- Improved table sorting with visual indicators (arrows)
- Enhanced action column layout and icon consistency
- Optimized page layouts and spacing
- Better mobile responsiveness

### Fixed

- Fixed size column sorting to use area calculation (length × width)
- Fixed view history button functionality in quilt management
- Fixed duplicate icons in operation columns
- Improved error handling and user feedback

### Technical

- TypeScript strict mode enabled
- Better component separation and reusability
- Consistent styling patterns across all pages
- Improved code organization

## [0.5.0] - 2025-11-04

### Added

- **System Settings**
  - Double-click behavior configuration for quilt list (none/status/edit)
  - Configurable interaction behavior in system settings
  - Database migration for double-click action setting

- **Import/Export**
  - Unified import/export page with tab navigation
  - Excel file import support (.xls, .xlsx)
  - CSV and JSON export functionality
  - Integrated existing import/export components

### Changed

- **Overall Framework**
  - Updated app title to "QMS家庭被子管理系统"
  - Removed language switcher from header
  - Updated app metadata to Chinese

- **Dashboard (仪表面板)**
  - Renamed from "仪表板" to "仪表面板"
  - Removed subtitle text
  - Date and weather now displayed on same line with larger font
  - Compact single-line display for "Currently in Use" quilts list
  - Compact single-line display for "Historical Usage" list

- **Quilt Management**
  - Default brand value set to "无品牌"
  - Default location value set to "未存储"
  - Number inputs (length/width/weight) now use integer steps
  - Double-click on table rows triggers configured action
  - Status change to "IN_USE" automatically sets location to "在用"
  - Status change to "IN_USE" automatically creates usage record

- **Analytics (数据分析)**
  - Renamed from "分析" to "数据分析"
  - Removed "Available" status from status distribution chart
  - More compact layout for "Most Used Quilts" list

- **Navigation**
  - "Reports" menu item renamed to "导入导出"
  - Updated navigation descriptions

### Fixed

- Usage record creation when changing quilt status to IN_USE
- Automatic location update when status changes

## [0.3.0] - 2025-11-03

### Added

- **Code Quality & Architecture**
  - Logging utility (`src/lib/logger.ts`) with environment-based filtering
  - Repository pattern for database operations
  - Type-safe database type definitions
  - Error boundaries with bilingual support
  - Base repository implementation for consistent data access

- **Authentication & Security**
  - Password utilities with bcrypt hashing (12 salt rounds)
  - JWT token generation and verification
  - Rate limiting for login attempts (5 attempts per 15 minutes)
  - Login page with password visibility toggle
  - Logout functionality
  - Middleware-based route protection
  - Database password storage (passwords stored in `system_settings` table)
  - Instant password changes without redeployment

- **API Consolidation**
  - tRPC integration for type-safe API calls
  - Unified error handling with `handleTRPCError`
  - Quilts router with tRPC
  - Usage router with tRPC
  - Settings router with tRPC
  - Removed duplicate REST API endpoints

- **Enhanced Settings Page**
  - Change password dialog with validation
  - Modify application name (saved to database)
  - Language switcher component (🇨🇳 中文 / 🇺🇸 English)
  - Real-time database statistics (auto-refresh every minute)
  - System information display (version, framework, environment)
  - Browser-based system settings initialization

- **Usage Tracking Improvements**
  - Migrated usage tracking to tRPC
  - Edit usage records functionality
  - Delete usage records functionality
  - Removed usage type field (simplified UI)
  - Removed season column from usage table

- **Database**
  - `system_settings` table for application configuration
  - Password hash storage in database
  - Application name storage
  - UUID extension support

### Changed

- Replaced `console.log` with structured logging throughout codebase
- Updated all database operations to use repository pattern
- Migrated frontend API calls from REST to tRPC
- Improved error handling with consistent error messages
- Enhanced settings page UI with better organization

### Fixed

- Usage record editing now works correctly with tRPC
- Toast notifications work properly in all components
- UUID generation in system_settings table
- Timestamp handling in database inserts

### Security

- Passwords now stored securely in database with bcrypt
- JWT tokens for session management
- Rate limiting on login endpoint
- HTTP-only cookies for token storage
- Middleware protection for all routes except login and health check

### Documentation

- Added `PASSWORD-MIGRATION-GUIDE.md` for password migration instructions
- Updated README with new features and setup instructions
- Added changelog for version tracking

## [0.2.2] - 2025-01-16

### Added

- Usage tracking automation
- Bilingual support (Chinese/English)
- Data validation with Zod
- UI enhancements with animations

### Changed

- Improved quilt management interface
- Enhanced data import/export

### Fixed

- Various bug fixes and performance improvements

## [0.2.0] - 2025-01-10

### Added

- Initial release with core functionality
- Quilt management (CRUD operations)
- Basic usage tracking
- Excel import/export
- Responsive design

---

[2026.6.2]: https://github.com/024812/qms/compare/v2026.4.2...v2026.6.2
[2026.4.2]: https://github.com/024812/qms/compare/v2026.2.21...v2026.4.2

# Review updates — 2026-09-25 (unreleased)

- Refresh the dependency lockfile to current compatible releases; retain TypeScript 6 and ESLint 9 due to verified tooling incompatibilities with their new majors.
- Require Node.js 22.13+ for the installed toolchain.
- Disable session cookie caching for immediate database-backed session revocation.
- Align new/reset passwords to 12 characters while allowing legacy credentials through login validation.
- Make user mutation cache invalidation usable from REST handlers and serialize user preference updates.
- Export all quilts and usage records from a repeatable-read snapshot instead of paginated defaults.
- Apply canonical quilt validation to Agent writes and evaluate purchase-date limits at validation time.
- Verification: lint, type-check, 33 test files / 360 tests, production build (117 static pages), npm audit (0 reported vulnerabilities). See `docs/reports/CODE_REVIEW_2026_09_25.md` for scope and limitations.
