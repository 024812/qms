/**
 * Check Database Tables
 *
 * This script checks which tables exist in the database.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(databaseUrl);

    // Query to get all tables
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log('📋 Tables in database:');
    result.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log(`\n   Total: ${result.length} tables\n`);

    // Check for specific tables we need
    const tableNames = result.map((row: any) => row.table_name);

    console.log('✅ Required tables check:');
    const requiredTables = ['users', 'quilts', 'cards', 'items', 'usage_logs'];

    requiredTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✓' : '✗'} ${table}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();
