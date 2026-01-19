# Database Migration Guide

## Overview

This guide walks you through setting up the database and running migrations for the extensible item management framework.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Neon PostgreSQL database (free tier available)

## Step 1: Create a Neon Database

### Option A: Using Neon (Recommended)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Create a new database (or use the default one)
5. Copy the connection string from the dashboard

The connection string will look like:
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Option B: Using Local PostgreSQL

If you prefer to use a local PostgreSQL instance:

1. Install PostgreSQL on your machine
2. Create a new database:
   ```bash
   createdb qms_development
   ```
3. Your connection string will be:
   ```
   postgresql://localhost:5432/qms_development
   ```

## Step 2: Configure Environment Variables

1. Open `.env.local` in your project root
2. Add or update the `DATABASE_URL`:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
```

3. Save the file

## Step 3: Verify Database Connection

Run the connection check script:

```bash
npm run db:check
```

You should see:
```
✅ DATABASE_URL is set
✅ Database connection successful!
⚠️  No tables found in database
   Run migrations with: npm run db:push
```

## Step 4: Run Migrations

### Option A: Push Schema (Recommended for Development)

This is the fastest way to sync your schema to the database:

```bash
npm run db:push
```

This will:
- Create all tables
- Create all enums
- Create all indexes
- Create all foreign key constraints

### Option B: Generate and Apply Migrations (Production)

For production or when you need migration history:

1. Generate migration files (already done):
   ```bash
   npm run db:generate
   ```

2. Apply migrations:
   ```bash
   npm run db:migrate
   ```

## Step 5: Verify Tables

After running migrations, check the database again:

```bash
npm run db:check
```

You should see:
```
✅ DATABASE_URL is set
✅ Database connection successful!
✅ Found tables:
   - items
   - usage_logs
   - users
```

## Step 6: (Optional) Open Drizzle Studio

Drizzle Studio is a GUI for viewing and editing your database:

```bash
npm run db:studio
```

This will open a web interface at `https://local.drizzle.studio`

## Database Schema

### Tables Created

#### 1. users
- `id` (uuid, primary key)
- `name` (text)
- `email` (text, unique)
- `password` (text, bcrypt hashed)
- `role` (enum: 'admin', 'member')
- `active_modules` (jsonb, array of module IDs)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 2. items (Single-Table Inheritance)
- `id` (uuid, primary key)
- `type` (enum: 'quilt', 'card', 'shoe', 'racket')
- `name` (text)
- `status` (enum: 'in_use', 'storage', 'maintenance', 'lost')
- `owner_id` (uuid, foreign key to users)
- `attributes` (jsonb, module-specific fields)
- `images` (jsonb, array of image URLs)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 3. usage_logs
- `id` (uuid, primary key)
- `item_id` (uuid, foreign key to items)
- `user_id` (uuid, foreign key to users)
- `action` (text: 'created', 'updated', 'status_changed', 'deleted')
- `snapshot` (jsonb, state at time of action)
- `created_at` (timestamp)

### Indexes Created

For optimal query performance:
- `users_email_idx` - Fast email lookups
- `items_type_idx` - Filter by item type
- `items_owner_idx` - Filter by owner
- `items_status_idx` - Filter by status
- `items_type_owner_idx` - Composite index for common queries
- `usage_logs_item_idx` - Fast item history lookups
- `usage_logs_user_idx` - Fast user activity lookups
- `usage_logs_created_at_idx` - Time-based queries

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solution**: Add DATABASE_URL to your `.env.local` file

### Error: "Connection refused"

**Possible causes**:
1. Database server is not running (for local PostgreSQL)
2. Incorrect host/port in connection string
3. Firewall blocking the connection

**Solution**: 
- For Neon: Check that your database is active in the dashboard
- For local: Start PostgreSQL service

### Error: "Authentication failed"

**Possible causes**:
1. Incorrect username or password
2. User doesn't have access to the database

**Solution**: Verify your credentials in the connection string

### Error: "SSL connection required"

**Solution**: Add `?sslmode=require` to the end of your connection string

### Error: "Database does not exist"

**Solution**: Create the database first:
```bash
# For local PostgreSQL
createdb your_database_name
```

## Migration Files

Migration files are stored in the `drizzle/` directory:
- `drizzle/0000_simple_paibok.sql` - Initial schema migration
- `drizzle/meta/` - Migration metadata

## Rollback

If you need to rollback migrations:

1. Drop all tables:
   ```bash
   npm run db:drop
   ```

2. Re-run migrations:
   ```bash
   npm run db:push
   ```

**⚠️ Warning**: This will delete all data!

## Next Steps

After successful migration:

1. ✅ Database schema is ready
2. ➡️ Proceed to Task 3: Implement Auth.js v5 authentication system
3. ➡️ Create user registration and login functionality
4. ➡️ Build the module registry system

## Available Scripts

- `npm run db:check` - Verify database connection
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Apply migrations
- `npm run db:push` - Push schema to database (fast)
- `npm run db:studio` - Open Drizzle Studio GUI
- `npm run db:drop` - Drop all tables (⚠️ destructive)

## Support

If you encounter issues:
1. Check the [Drizzle ORM documentation](https://orm.drizzle.team)
2. Check the [Neon documentation](https://neon.tech/docs)
3. Review the error messages carefully
4. Ensure all environment variables are set correctly

## Requirements Satisfied

✅ **Requirement 2.1**: Database schema with users, items, and usage_logs tables  
✅ **Requirement 2.2**: JSONB fields for flexible attribute storage  
✅ **Requirement 2.4**: Foreign key relationships and cascade deletes  
✅ **Requirement 8.1**: User authentication foundation with role-based access  
✅ **Requirement 9.1**: Database indexes for query optimization
