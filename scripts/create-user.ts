#!/usr/bin/env tsx
/**
 * Create User Script
 *
 * Creates a new user in the database
 *
 * Usage: npm run create-user
 */

import 'dotenv/config';
import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as readline from 'readline';

// ... imports ...

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// ... existing code ...

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
    const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

    if (existing.length > 0) {
      console.log(`❌ User with email ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate UUID for id field
    const userId = randomUUID();

    // Create user
    console.log('⏳ Creating user...');
    
    const [user] = await db.insert(users).values({
        id: userId,
        name,
        email,
        hashedPassword,
        preferences: { role: "admin", activeModules: ["quilts"] },
    }).returning();

    // const user = result[0]; // Not needed with destructuring above

    console.log('\n✅ User created successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.preferences?.role || 'member'}`);
    console.log(`  Active Modules: ${user.preferences?.activeModules?.join(', ') || 'none'}`);
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
