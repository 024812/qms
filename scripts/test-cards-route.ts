/**
 * Test Cards Route
 * 
 * This script simulates what happens when accessing /cards route
 */

import 'dotenv/config';
import { db } from '../src/db/index';
import { cards, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { MODULE_REGISTRY } from '../src/modules/registry';

async function testCardsRoute() {
  console.log('🧪 Testing /cards route...\n');

  try {
    // 1. Check if 'cards' module exists in registry
    console.log('1️⃣ Checking module registry...');
    const module = MODULE_REGISTRY['cards'];
    if (!module) {
      console.log('   ❌ Module "cards" not found in registry!');
      return;
    }
    console.log(`   ✓ Module found: ${module.name}`);
    console.log(`   ✓ Module ID: ${module.id}\n`);

    // 2. Check user's activeModules
    console.log('2️⃣ Checking user subscriptions...');
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      const activeModules = user.preferences?.activeModules || [];
      console.log(`   User: ${user.email}`);
      console.log(`   Active modules: ${activeModules.join(', ')}`);
      console.log(`   Has 'cards'? ${activeModules.includes('cards') ? '✓' : '✗'}\n`);
    }

    // 3. Try to query cards table
    console.log('3️⃣ Querying cards table...');
    const allCards = await db.select().from(cards);
    console.log(`   Total cards: ${allCards.length}`);
    
    if (allCards.length > 0) {
      console.log('   Sample card:');
      const sample = allCards[0];
      console.log(`     - ID: ${sample.id}`);
      console.log(`     - Player: ${sample.playerName}`);
      console.log(`     - Year: ${sample.year}`);
      console.log(`     - Brand: ${sample.brand}`);
    }

    console.log('\n✅ All checks passed! Route should work.');
    console.log('\n💡 If still getting 404, check:');
    console.log('   1. Vercel deployment logs');
    console.log('   2. Browser console for errors');
    console.log('   3. Network tab for actual error response');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCardsRoute();
