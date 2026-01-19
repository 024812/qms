#!/usr/bin/env tsx
/**
 * Create User Script
 *
 * Creates a new user in the database
 *
 * Usage: npm run create-user
 */

import { sql } from '../src/lib/neon';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  console.log('\n👤 Create New User\n');

  try {
    // Get user details
    const name = await question('Name: ');
    const email = await question('Email: ');
    const password = await question('Password (min 6 characters): ');

    if (!name || !email || !password) {
      console.log('❌ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log(`❌ User with email ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    console.log('⏳ Creating user...');
    const result = await sql`
      INSERT INTO users (name, email, password, role, active_modules)
      VALUES (${name}, ${email}, ${hashedPassword}, 'admin', '["quilts"]'::jsonb)
      RETURNING id, name, email, role
    `;

    const user = result[0];

    console.log('\n✅ User created successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active Modules: quilts`);
    console.log('\n🔐 You can now login with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: (the password you entered)\n`);
  } catch (error) {
    console.error('\n❌ Error creating user:', error);
    throw error;
  } finally {
    rl.close();
  }
}

createUser()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
