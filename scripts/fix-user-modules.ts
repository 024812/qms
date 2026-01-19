#!/usr/bin/env tsx
/**
 * Fix User Active Modules
 * 
 * Removes invalid module IDs from user's activeModules
 * 
 * Usage: npx tsx scripts/fix-user-modules.ts
 */

// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

async function fixUserModules() {
  console.log('\n🔧 Fixing user active modules...\n');

  const email = 'lixi@oheng.com';
  const validModules = ['quilt', 'card']; // Valid module IDs from registry

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Query user
    console.log(`⏳ Querying user: ${email}`);
    const result = await sql`
      SELECT id, name, email, preferences
      FROM users 
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    const user = result[0];
    const currentModules = user.preferences?.activeModules || [];

    console.log(`\n📋 Current active modules: ${currentModules.join(', ')}`);

    // Filter to only valid modules
    const fixedModules = currentModules.filter((m: string) => validModules.includes(m));

    console.log(`📋 Fixed active modules: ${fixedModules.join(', ')}`);

    if (JSON.stringify(currentModules) === JSON.stringify(fixedModules)) {
      console.log('\n✅ No changes needed - modules are already correct!');
      return;
    }

    // Update user preferences
    console.log('\n⏳ Updating user preferences...');
    const updatedPreferences = {
      ...user.preferences,
      activeModules: fixedModules,
    };

    await sql`
      UPDATE users 
      SET preferences = ${JSON.stringify(updatedPreferences)}::jsonb,
          updated_at = NOW()
      WHERE email = ${email}
    `;

    console.log('\n✅ User active modules fixed!\n');
    console.log('━'.repeat(60));
    console.log(`\nBefore: ${currentModules.join(', ')}`);
    console.log(`After:  ${fixedModules.join(', ')}`);
    console.log('\n━'.repeat(60));
    console.log('\n💡 Please logout and login again to see the changes.\n');

  } catch (error) {
    console.error('\n❌ Error fixing user modules:', error);
    throw error;
  }
}

fixUserModules()
  .then(() => {
    console.log('✅ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
