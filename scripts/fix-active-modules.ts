/**
 * Fix Active Modules Script
 * 
 * This script updates user activeModules to use plural form only.
 * Removes old singular forms (quilt, card) and keeps only plural forms (quilts, cards).
 */

import 'dotenv/config';
import { db } from '../src/db/index';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function fixActiveModules() {
  console.log('🔧 Fixing active modules...\n');

  try {
    // Get all users
    const allUsers = await db.select().from(users);

    console.log(`📊 Found ${allUsers.length} users\n`);

    for (const user of allUsers) {
      const preferences = user.preferences || {};
      const activeModules = preferences.activeModules || [];

      if (activeModules.length === 0) {
        console.log(`⏭️  Skipping ${user.email} (no active modules)`);
        continue;
      }

      console.log(`👤 Processing ${user.email}`);
      console.log(`   Current modules: ${activeModules.join(', ')}`);

      // Map singular to plural
      const moduleMapping: Record<string, string> = {
        'quilt': 'quilts',
        'card': 'cards',
        'shoe': 'shoes',
        'racket': 'rackets',
      };

      // Convert to plural and remove duplicates
      const fixedModules = Array.from(
        new Set(
          activeModules.map((mod: string) => moduleMapping[mod] || mod)
        )
      );

      console.log(`   Fixed modules: ${fixedModules.join(', ')}`);

      // Update user preferences
      await db
        .update(users)
        .set({
          preferences: {
            ...preferences,
            activeModules: fixedModules,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      console.log(`   ✅ Updated\n`);
    }

    console.log('✅ All users updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixActiveModules();
