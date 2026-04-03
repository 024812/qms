# Quick Start

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
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## 3. Apply The Database Schema

```bash
npm run db:push
```

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
```

## Current Project Shape

```text
proxy.ts
src/
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

- Route protection lives in the root `proxy.ts` file.
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
- Re-run `npm run db:push`

### Authentication issues

- Verify `NEXTAUTH_SECRET`
- Verify `NEXTAUTH_URL`
- Clear cookies after changing auth configuration

### Build issues

- Run `npm run lint:check`
- Run `npm run type-check`
- Run `npm test`
