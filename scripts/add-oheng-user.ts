#!/usr/bin/env tsx
/**
 * Add oheng user to database
 * One-time script to create the oheng user
 */

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function addUser() {
  console.log('\n👤 Adding oheng user to database...\n');

  const name = 'oheng';
  const email = 'lixi@oheng.com';
  const password = 'passwd12';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // First, check the actual table structure
    console.log('⏳ Checking users table structure...');
    const tableInfo = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('📋 Users table columns:');
    tableInfo.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // Check if user already exists
    console.log('⏳ Checking if user exists...');
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log(`⚠️  User with email ${email} already exists`);
      console.log(`   User ID: ${existing[0].id}`);
      console.log('\n✅ You can login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
      return;
    }

    // Hash password
    console.log('⏳ Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate UUID for id field
    const userId = randomUUID();

    // Create user
    console.log('⏳ Creating user...');
    const result = await sql`
      INSERT INTO users (id, name, email, hashed_password, preferences, created_at, updated_at)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, '{"activeModules": ["quilts"], "role": "admin"}'::jsonb, NOW(), NOW())
      RETURNING id, name, email, preferences, created_at
    `;

    const user = result[0];

    console.log('\n✅ User created successfully!\n');
    console.log('━'.repeat(60));
    console.log('\n📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Preferences: ${JSON.stringify(user.preferences)}`);
    console.log(`   Created At: ${user.created_at}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n━'.repeat(60));
    console.log('\n✅ You can now login at: http://localhost:3000/login\n');
  } catch (error) {
    console.error('\n❌ Error adding user:', error);
    throw error;
  }
}

addUser()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
