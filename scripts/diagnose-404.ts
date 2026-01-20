/**
 * Diagnose 404 Issues
 *
 * This script checks:
 * 1. User's activeModules in database
 * 2. Module registry configuration
 * 3. Database items table
 */

import 'dotenv/config';
import { db } from '../src/db/index';
import { users, items } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { MODULE_REGISTRY, getModuleIds } from '../src/modules/registry';

async function diagnose() {
  console.log('🔍 Diagnosing 404 issues...\n');

  try {
    // 1. Check module registry
    console.log('📋 Module Registry:');
    const moduleIds = getModuleIds();
    console.log(`   Registered modules: ${moduleIds.join(', ')}`);
    console.log(`   Total: ${moduleIds.length}\n`);

    // 2. Check all users and their activeModules
    console.log('👥 Users and their activeModules:');
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const preferences = user.preferences || {};
      const activeModules = preferences.activeModules || [];

      console.log(`\n   📧 ${user.email}`);
      console.log(`      Role: ${user.preferences?.role || 'member'}`);
      console.log(
        `      Active Modules: ${activeModules.length > 0 ? activeModules.join(', ') : 'NONE'}`
      );

      // Check if activeModules match registry
      const invalidModules = activeModules.filter((m: string) => !moduleIds.includes(m));
      if (invalidModules.length > 0) {
        console.log(`      ⚠️  Invalid modules: ${invalidModules.join(', ')}`);
      }
    }

    // 3. Check items table
    console.log('\n\n📦 Items in database:');
    const allItems = await db.select().from(items);
    console.log(`   Total items: ${allItems.length}`);

    // Group by type
    const itemsByType: Record<string, number> = {};
    allItems.forEach(item => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    });

    console.log('   Items by type:');
    Object.entries(itemsByType).forEach(([type, count]) => {
      console.log(`      ${type}: ${count}`);
    });

    // 4. Check for type mismatches
    console.log('\n\n🔄 Type mapping check:');
    console.log('   Module IDs (plural): ' + moduleIds.join(', '));
    console.log('   Database types (singular): ' + Object.keys(itemsByType).join(', '));

    // 5. Recommendations
    console.log('\n\n💡 Recommendations:');

    const usersWithNoModules = allUsers.filter(u => {
      const activeModules = u.preferences?.activeModules || [];
      return activeModules.length === 0;
    });

    if (usersWithNoModules.length > 0) {
      console.log('   ⚠️  Users with no active modules:');
      usersWithNoModules.forEach(u => {
        console.log(`      - ${u.email}`);
      });
      console.log('   → Run: npx tsx scripts/fix-active-modules.ts');
    }

    const usersWithInvalidModules = allUsers.filter(u => {
      const activeModules = u.preferences?.activeModules || [];
      return activeModules.some((m: string) => !moduleIds.includes(m));
    });

    if (usersWithInvalidModules.length > 0) {
      console.log('   ⚠️  Users with invalid module IDs:');
      usersWithInvalidModules.forEach(u => {
        const activeModules = u.preferences?.activeModules || [];
        const invalid = activeModules.filter((m: string) => !moduleIds.includes(m));
        console.log(`      - ${u.email}: ${invalid.join(', ')}`);
      });
      console.log('   → Run: npx tsx scripts/fix-active-modules.ts');
    }

    console.log('\n✅ Diagnosis complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose();
