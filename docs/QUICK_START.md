# Quick Start Guide

## Get Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
copy .env.example .env.local

# Edit .env.local and add your database URL and secrets
```

Required environment variables:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Configured

✅ **Next.js 16.1** - Latest version with App Router  
✅ **TypeScript 5** - Full type safety  
✅ **Drizzle ORM** - Type-safe database queries  
✅ **Auth.js v5** - Modern authentication  
✅ **shadcn/ui** - Beautiful UI components  
✅ **Tailwind CSS v4** - Latest styling framework  
✅ **Neon PostgreSQL** - Serverless database connection  

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── auth.ts           # Authentication configuration
├── middleware.ts     # Route protection
├── db/               # Database schema and client
├── modules/          # Module system (to be implemented)
├── components/       # React components
└── lib/              # Utilities
```

## Next Steps

1. **Phase 1**: Implement user management system
2. **Phase 2**: Migrate quilt management to new framework
3. **Phase 3**: Add sports card management module

See [SETUP.md](./SETUP.md) for detailed documentation.

## Available Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open database GUI
npm run db:generate      # Generate migrations

# Code Quality
npm run lint             # Fix linting issues
npm run type-check       # Check TypeScript types
npm run format           # Format code
```

## Troubleshooting

**Database connection error?**
- Check your `DATABASE_URL` in `.env.local`
- Ensure Neon database is accessible

**Authentication not working?**
- Verify `NEXTAUTH_SECRET` is set
- Clear browser cookies

**Build errors?**
- Run `npm run type-check`
- Run `npm run lint`
- Delete `.next` folder and rebuild

## Support

- [Full Setup Guide](./SETUP.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Auth.js Docs](https://authjs.dev)
