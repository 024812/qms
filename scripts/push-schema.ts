/**
 * Push Schema to Database
 *
 * This script pushes the current schema to the database using Drizzle.
 * Use this to sync your database with the schema definition.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';

async function pushSchema() {
  console.log('🚀 Pushing schema to database...\n');

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('📡 Connecting to database...');
    const sql = neon(databaseUrl);
    const db = drizzle(sql);

    console.log('📦 Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('\n✅ Schema pushed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify tables exist: npx tsx scripts/diagnose-404.ts');
    console.log('   2. Test the application: npm run dev');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

pushSchema();
