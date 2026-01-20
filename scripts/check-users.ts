/**
 * Check Users Script
 * 
 * Lists all users in the database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '@/db';
import { users } from '@/db/schema';

async function checkUsers() {
  try {
    console.log('Fetching all users from database...\n');

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        preferences: users.preferences,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    console.log(`Found ${allUsers.length} users:\n`);

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.preferences?.role || 'member'}`);
      console.log(`   Active Modules: ${user.preferences?.activeModules?.join(', ') || 'none'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

checkUsers();
