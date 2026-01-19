#!/usr/bin/env tsx
/**
 * Test Login Script
 * 
 * Tests if the password matches the hashed password in database
 */

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function testLogin() {
  console.log('\n🔐 Testing login credentials...\n');

  const email = 'lixi@oheng.com';
  const password = 'passwd12';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Query user
    console.log(`⏳ Querying user: ${email}`);
    const result = await sql`
      SELECT id, name, email, hashed_password, preferences
      FROM users 
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const user = result[0];
    console.log(`✅ User found: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.preferences?.role}`);
    console.log(`   Active Modules: ${user.preferences?.activeModules?.join(', ')}`);

    // Test password
    console.log(`\n⏳ Testing password: "${password}"`);
    console.log(`   Hashed password: ${user.hashed_password.substring(0, 20)}...`);
    
    const passwordMatch = await bcrypt.compare(password, user.hashed_password);

    if (passwordMatch) {
      console.log('\n✅ Password matches! Login should work.');
    } else {
      console.log('\n❌ Password does NOT match! This is the problem.');
      console.log('\n💡 Try resetting the password with:');
      console.log('   npm run add-oheng-user');
    }

  } catch (error) {
    console.error('\n❌ Error testing login:', error);
    throw error;
  }
}

testLogin()
  .then(() => {
    console.log('\n✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
