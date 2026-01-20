/**
 * Check specific user
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

async function checkUser() {
  try {
    console.log('Checking for user lixi@oheng.com...\n');

    const result = await db.execute(sql`
      SELECT * FROM users WHERE email = 'lixi@oheng.com'
    `);

    if (result.rows.length > 0) {
      console.log('User found:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('User NOT found');
    }

    console.log('\n\nAll users in database:');
    const allUsers = await db.execute(sql`
      SELECT id, email, name, preferences FROM users
    `);

    console.log(`Total users: ${allUsers.rows.length}`);
    allUsers.rows.forEach((user: any) => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.preferences?.role || 'N/A'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
