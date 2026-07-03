# QMS Documentation

This directory contains the active documentation for QMS.

Current release: `2026.7.3`

## Core Docs

- `QUICK_START.md` - shortest path to run the project.
- `PROJECT_SUMMARY.md` - architecture, module standardization, and release overview.
- `MODULE_BLUEPRINT_V2.md` - active copyable module blueprint.
- `MODULE_STANDARD.md` - deprecated legacy module standard retained for historical context.

## Guides

Located in `docs/guides/`:

- `AUTH_IMPLEMENTATION_SUMMARY.md` - Better Auth implementation notes.
- `AUTH_TEST_GUIDE.md` - authentication test checklist.
- `DATABASE_MIGRATIONS.md` - Neon and Drizzle migration workflow.
- `INITIALIZE-DATABASE.md` - sample-data initialization notes.
- `VERCEL-ENV-SETUP.md` - Vercel environment variables.
- `VERCEL_DEPLOYMENT_GUIDE.md` - deployment flow and checks.
- `BACKUP_QUICK_START.md` - backup quick start.
- `BACKUP_RESTORE_GUIDE.md` - detailed backup and restore guide.
- `PASSWORD-MIGRATION-GUIDE.md` - legacy password storage migration notes.
- `SECURITY_AUDIT_SUMMARY.md` - security audit summary.
- `USAGE_TRACKING_IMPLEMENTATION.md` - usage module implementation notes.

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
