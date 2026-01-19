# Project Setup Guide

## Overview

This document provides instructions for setting up the Extensible Item Management Framework project.

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- PostgreSQL database (Neon recommended)

## Technology Stack

- **Frontend**: Next.js 16.1 (App Router), React 19, TypeScript 5
- **Backend**: Next.js Server Actions
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Auth.js v5 (NextAuth.js v5)
- **UI Components**: shadcn/ui + Tailwind CSS v4
- **Form Handling**: Next.js 16 Form Component + Zod validation
- **Testing**: Vitest + Testing Library + fast-check

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env.local
```

Edit `.env.local` and configure the following variables:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Authentication (Required)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Set Up Database

#### Generate Database Schema

```bash
npm run db:generate
```

#### Push Schema to Database

```bash
npm run db:push
```

#### (Optional) Open Drizzle Studio

```bash
npm run db:studio
```

This will open a web interface at `https://local.drizzle.studio` to view and manage your database.

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run dev:turbo` - Start development server with Turbopack
- `npm run dev:debug` - Start development server with Node.js inspector

### Build & Production

- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run build:production` - Build with production environment

### Database

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:drop` - Drop database tables

### Code Quality

- `npm run lint` - Run ESLint and fix issues
- `npm run lint:check` - Run ESLint without fixing
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm run test` - Run tests (to be configured)
- `npm run test:watch` - Run tests in watch mode (to be configured)

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── actions/           # Server Actions
│   ├── auth.ts                # Auth.js v5 configuration
│   ├── middleware.ts          # Route protection middleware
│   ├── db/                    # Database schema and connection
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   └── index.ts           # Database client
│   ├── modules/               # Module system (core business logic)
│   │   ├── types.ts           # Module interfaces
│   │   ├── registry.ts        # Module registry
│   │   ├── core/              # Shared components
│   │   ├── quilts/            # Quilt module
│   │   ├── cards/             # Card module (future)
│   │   └── ...                # Other modules
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Utility functions
│   ├── hooks/                 # React hooks
│   └── types/                 # TypeScript type definitions
├── drizzle/                   # Generated migrations
├── drizzle.config.ts          # Drizzle configuration
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Database Schema

The project uses a **single-table inheritance pattern** with JSONB for module-specific attributes:

### Tables

1. **users** - User accounts with RBAC
   - id, name, email, password, role, activeModules

2. **items** - Universal items table
   - id, type, name, status, ownerId, attributes (JSONB), images (JSONB)

3. **usage_logs** - Activity tracking
   - id, itemId, userId, action, snapshot (JSONB)

## Authentication

The project uses Auth.js v5 with credentials provider:

- Login page: `/login`
- Protected routes: All routes except `/login` and `/register`
- Session management: JWT-based
- Password hashing: bcrypt

## Module System

The framework supports multiple item types through a module registry:

- **Quilts** - Quilt/blanket management
- **Cards** - Sports card collection (future)
- **Shoes** - Shoe collection (future)
- **Rackets** - Racket collection (future)

Each module defines:
- Schema (Zod validation)
- Form fields configuration
- List columns configuration
- Custom UI components

## Next Steps

1. Create your first user account
2. Subscribe to modules
3. Start managing items

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure Neon database is accessible
- Check SSL mode is set to `require`

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### Build Issues

- Run `npm run type-check` to identify TypeScript errors
- Run `npm run lint` to fix linting issues
- Clear `.next` directory and rebuild

## Support

For issues and questions, please refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Auth.js Documentation](https://authjs.dev)
- [shadcn/ui Documentation](https://ui.shadcn.com)
