# Quick Start

> 环境约束：本仓库位于 OneDrive。必须先复制到 `C:\temp\<project>`，再执行 `npm install`/`npm ci`、测试、构建或启动服务；不要在 OneDrive 工作区生成 `node_modules`、`.next` 等目录。

## 1. Install Dependencies

```bash
npm install
```

## 2. Create Your Local Environment File

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS or Linux:

```bash
cp .env.example .env.local
```

Minimum recommended values:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

## 3. Apply The Database Schema

```bash
npm run db:migrate
```

Migrations target Neon Postgres. Put the real Neon `DATABASE_URL` in `.env.local`; do not point this project at a local `localhost:5432` database.

## 4. Start The App

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5. Run Quality Checks

```bash
npm run lint:check
npm run type-check
npm test
npm run build
```

以上命令必须在 `C:\temp\<project>` 副本中执行。生产数据库变更使用 `npm run db:migrate`，不要使用 `db:push`。

## Current Project Shape

```text
src/
  proxy.ts
  app/
    [locale]/
    actions/
    api/
  components/
  db/
  hooks/
  lib/
    data/
  modules/
docs/
```

## Architecture Notes

- Route protection lives in `src/proxy.ts`.
- Internal reads and writes should go through `src/app/actions/*.ts` and `src/lib/data/*.ts`.
- React Query is used as a client-side interaction wrapper, not as the primary data truth layer.

## Useful Commands

```bash
npm run dev
npm run dev:turbo
npm run build
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Troubleshooting

### Database connection issues

- Verify `DATABASE_URL` in `.env.local`
- Re-run `npm run db:migrate`

### Authentication issues

- Verify `BETTER_AUTH_SECRET`
- Verify `BETTER_AUTH_URL`
- Verify `NEXT_PUBLIC_BETTER_AUTH_URL`
- Clear cookies after changing auth configuration

### Build issues

- Run `npm run lint:check`
- Run `npm run type-check`
- Run `npm test`
