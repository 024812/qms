import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.local');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export * from '../src/db/schema';
