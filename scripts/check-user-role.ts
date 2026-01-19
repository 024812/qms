#!/usr/bin/env tsx
/**
 * Check User Role Script
 * 
 * Checks the role of a specific user in the database
 * 
 * Usage: npx tsx scripts/check-user-role.ts
 */

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

async function checkUserRole() {
  console.log('\n👤 Checking user role...\n');

  const email = 'lixi@oheng.com';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Query user
    console.log(`⏳ Querying user: ${email}`);
    const result = await sql`
      SELECT id, name, email, preferences, created_at, updated_at
      FROM users 
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const user = result[0];

    console.log('\n✅ User found!\n');
    console.log('━'.repeat(60));
    console.log('\n📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Preferences: ${JSON.stringify(user.preferences, null, 2)}`);
    console.log(`   Role: ${user.preferences?.role || 'member'}`);
    console.log(`   Active Modules: ${user.preferences?.activeModules?.join(', ') || 'none'}`);
    console.log(`   Created At: ${user.created_at}`);
    console.log(`   Updated At: ${user.updated_at}`);
    console.log('\n━'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('\n❌ Error checking user:', error);
    throw error;
  }
}

checkUserRole()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
