# QMS Documentation

This directory contains both active documentation and historical implementation records. Each document is marked `active` or `historical`; historical reports describe a past state and must not override the current code, package versions, or V3 blueprint.

Current release: `2026.9.11`

## Start Here

- [Quick start](guides/QUICK_START.md) - shortest path to run the project.
- [Project summary](PROJECT_SUMMARY.md) - product boundaries, architecture, and release overview.
- [REST API Reference](API_REFERENCE.md) - standardized REST API across all modules and response envelopes.

## Architecture

- [Module blueprint](architecture/MODULE_BLUEPRINT_V3.md) - active copyable module blueprint.
- [Module blueprint V2](architecture/MODULE_BLUEPRINT_V2.md) - historical migration reference; do not use for new modules.
- [Authentication implementation](architecture/AUTH_IMPLEMENTATION_SUMMARY.md) - Better Auth architecture and account lifecycle.
- [Legacy module standard](archive/MODULE_STANDARD.md) - deprecated standard retained for historical context.

## Guides

- [Authentication test guide](guides/AUTH_TEST_GUIDE.md) - active, Better Auth and module authorization tests.
- [Database migrations](guides/DATABASE_MIGRATIONS.md) - active, Neon and `db:migrate` workflow.
- [Database initialization](guides/INITIALIZE-DATABASE.md)
- [Vercel environment setup](guides/VERCEL-ENV-SETUP.md)
- [Vercel deployment](guides/VERCEL_DEPLOYMENT_GUIDE.md)
- [Backup quick start](guides/BACKUP_QUICK_START.md) - active operational guidance; npm backup scripts are not present.
- [Backup and restore](guides/BACKUP_RESTORE_GUIDE.md) - active operational guidance; automation is planned.
- [Legacy password migration](guides/PASSWORD-MIGRATION-GUIDE.md)

## Reports

- [Security audit](reports/SECURITY_AUDIT_SUMMARY.md) - active current report, dated `2026-07-17`.
- [Full-project code review](reports/CODE_REVIEW_2026_09_18.md) - active current report, dated `2026-09-18`. Verification results, P1/P2/P3 findings, architecture-compliance matrix, and the fix log for the P1 items.
- [Usage tracking implementation](reports/USAGE_TRACKING_IMPLEMENTATION.md) - historical record, corrected to the current DAL/Action architecture.
- [Card market-data implementation](reports/MARKET_DATA_IMPLEMENTATION.md) - historical/partial implementation; real provider is not complete.
- [Dependency and schema upgrade report](reports/UPGRADE_REPORT_2026_06_16.md) - historical report; current versions are defined by `package.json`.

## Conventions

- Route protection lives in `src/proxy.ts`.
- Internal reads and writes should use `src/app/actions/*.ts` and `src/lib/data/*.ts`.
- `/api/**` routes are external HTTP or third-party integration surfaces. `GET /api/quilts` additionally serves a legacy compatibility surface and marks its responses with `X-QMS-API-Surface: compatibility`.
- `/api/agent/**` is the restricted OpenAPI/tool surface for AI agents.
- Database migrations target Neon Postgres. Do not run QMS migrations against `localhost:5432`.
- Install, test, build, and run commands in this OneDrive workspace must be executed from a `C:\temp\<project>` copy.

## Related Files

- `../README.md`
- `../README_zh.md`
- `../CHANGELOG.md`
