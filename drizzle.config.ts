import { defineConfig } from 'drizzle-kit';
import { existsSync, readFileSync } from 'node:fs';

function loadEnvFile(path: string, override = false) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (!key || (!override && process.env[key] !== undefined)) continue;

    const value = rawValue.trim();
    process.env[key] =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local', true);

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
