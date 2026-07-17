# QMS Documentation

This directory contains the active documentation for QMS.

Current release: `2026.7.17`

## Start Here

- [Quick start](guides/QUICK_START.md) - shortest path to run the project.
- [Project summary](PROJECT_SUMMARY.md) - product boundaries, architecture, and release overview.

## Architecture

- [Module blueprint](architecture/MODULE_BLUEPRINT_V2.md) - active copyable module blueprint.
- [Authentication implementation](architecture/AUTH_IMPLEMENTATION_SUMMARY.md) - Better Auth architecture and account lifecycle.
- [Legacy module standard](archive/MODULE_STANDARD.md) - deprecated standard retained for historical context.

## Guides

- [Authentication test guide](guides/AUTH_TEST_GUIDE.md)
- [Database migrations](guides/DATABASE_MIGRATIONS.md)
- [Database initialization](guides/INITIALIZE-DATABASE.md)
- [Vercel environment setup](guides/VERCEL-ENV-SETUP.md)
- [Vercel deployment](guides/VERCEL_DEPLOYMENT_GUIDE.md)
- [Backup quick start](guides/BACKUP_QUICK_START.md)
- [Backup and restore](guides/BACKUP_RESTORE_GUIDE.md)
- [Legacy password migration](guides/PASSWORD-MIGRATION-GUIDE.md)

## Reports

- [Security audit](reports/SECURITY_AUDIT_SUMMARY.md)
- [Usage tracking implementation](reports/USAGE_TRACKING_IMPLEMENTATION.md)
- [Card market-data implementation](reports/MARKET_DATA_IMPLEMENTATION.md)
- [Dependency and schema upgrade report](reports/UPGRADE_REPORT_2026_06_16.md)

## Conventions

- Route protection lives in `src/proxy.ts`.
- Internal reads and writes should use `src/app/actions/*.ts` and `src/lib/data/*.ts`.
- `/api/**` routes are compatibility, external HTTP, or third-party integration surfaces.
- `/api/agent/**` is the restricted OpenAPI/tool surface for AI agents.
- Database migrations target Neon Postgres. Do not run QMS migrations against `localhost:5432`.

## Related Files

- `../README.md`
- `../README_zh.md`
- `../CHANGELOG.md`
