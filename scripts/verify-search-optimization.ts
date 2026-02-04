import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { ebayClient } from '../src/modules/cards/services/ebay-api-client';
import { aiCardService } from '../src/modules/cards/services/ai-card-service';
import { CardDetails } from '../src/modules/cards/services/price-data-providers';

async function verifySearchOptimization() {
  console.log('🔍 Verifying Search Optimization...');

  // Test Case: Victor Wembanyama Prizm Base (often confused with parallels)
  const testCard: CardDetails = {
    playerName: 'Victor Wembanyama',
    year: 2023,
    brand: 'Panini Prizm',
    cardNumber: '136',
    gradingCompany: 'PSA',
    grade: 10,
  };

  console.log('------------------------------------------------');
  console.log('Testing Card:', JSON.stringify(testCard, null, 2));
  console.log('------------------------------------------------');

  try {
    // 1. Fetch Raw Results (Strategy 1: Enhanced Query)
    console.log('\n📡 Fetching from eBay (Enhanced Query)...');

    // We construct the query params manually to match price provider logic
    const ebayParams = {
      playerName: testCard.playerName,
      year: testCard.year,
      brand: testCard.brand,
      cardNum: testCard.cardNumber,
      gradingCompany: testCard.gradingCompany,
      grade: testCard.grade,
    };

    const rawResults = await ebayClient.searchSoldListings(ebayParams);

    console.log(`✅  Found ${rawResults.length} raw results.`);
    if (rawResults.length > 0) {
      console.log('   Top 5 Raw Titles:');
      rawResults.slice(0, 5).forEach((r, i) => console.log(`   ${i + 1}. ${r.title}`));
    } else {
      console.warn(
        '   No results found. Search query might be too strict or API issue (Sandbox?).'
      );
    }

    // 2. AI Filtering (Strategy 2)
    // We pass the raw results (even if empty, just to show call works)
    console.log('\n🤖 Applying AI Filtering...');
    const filteredResults = await aiCardService.filterEbaySalesWithAI(testCard, rawResults);

    console.log(`✅  Filtered to ${filteredResults.length} results.`);
    console.log(`   Removed ${rawResults.length - filteredResults.length} irrelevant listings.`);

    if (filteredResults.length > 0) {
      console.log('   Top 5 Filtered Titles:');
      filteredResults.slice(0, 5).forEach((r, i) => console.log(`   ${i + 1}. ${r.title}`));
    }

    console.log('\n✨ Verification Complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  }
}

verifySearchOptimization();
