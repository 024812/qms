import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit Configuration
 * 
 * This configuration file is used by Drizzle Kit for:
 * - Generating migrations
 * - Pushing schema changes to the database
 * - Introspecting the database
 * 
 * Usage:
 * - Generate migration: npx drizzle-kit generate
 * - Push schema: npx drizzle-kit push
 * - Studio: npx drizzle-kit studio
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
