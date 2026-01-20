/**
 * Check users table schema
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

async function checkUsersSchema() {
  try {
    console.log('Checking users table schema...\n');

    // Get column information
    const result = await db.execute(sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('Users table columns:');
    console.log('-------------------');
    result.rows.forEach((col: any) => {
      console.log(`${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n\nQuerying first user...\n');
    
    // Get first user
    const userResult = await db.execute(sql`
      SELECT * FROM users LIMIT 1
    `);

    if (userResult.rows.length > 0) {
      console.log('First user data:');
      console.log(JSON.stringify(userResult.rows[0], null, 2));
    } else {
      console.log('No users found in table');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsersSchema();
