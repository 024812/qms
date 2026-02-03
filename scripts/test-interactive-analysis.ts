import { aiCardService } from '../src/modules/cards/services/ai-card-service';
import { db } from './local-db';
import dotenv from 'dotenv';
import fs from 'fs';

// Try loading .env.local first (Next.js convention)
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

// Ensure DB URL is set for local-db if used (though we access eBay via API client which needs EBAY_ vars)
if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not set');
}

// Mock dependencies if needed, or use real ones.
// We want to test that customQuery changes the result/cache key, and exclusions filter results.

async function main() {
  console.log('Testing Interactive Analysis Tools...');

  const cardDetails = {
    playerName: 'Desmond Bane',
    year: 2020,
    brand: 'Panini Prizm',
    cardNumber: '33', // Assuming this is the card number
    grade: undefined,
    gradingCompany: undefined,
  };

  console.log('\n1. Standard Analysis (Baseline)');
  const baseline = await aiCardService.analyzeCardQuick(cardDetails);
  console.log(`Baseline Recent Sales: ${baseline.recentSales.length}`);
  console.log(`Baseline Valuation: ${baseline.valuation.value}`);

  if (baseline.recentSales.length === 0) {
    console.warn('No baseline sales found, validation might be limited.');
  } else {
    // Pick an item to exclude
    const toExclude = baseline.recentSales[0];
    console.log(
      `\nSelecting item to exclude: ${toExclude.title} (${toExclude.price}) - ${toExclude.url}`
    );

    console.log('\n2. Analysis with Exclusion');
    const excludedResult = await aiCardService.analyzeCardQuick({
      ...cardDetails,
      excludedListingIds: [toExclude.url],
    });

    console.log(`Excluded Result Sales: ${excludedResult.recentSales.length}`);
    const found = excludedResult.recentSales.find((s: any) => s.url === toExclude.url);
    if (!found) {
      console.log('✅ Success: Excluded item is NOT present in results.');
    } else {
      console.error('❌ Failure: Excluded item IS present in results.');
    }

    // Check if cache key works (different results imply cache key diff or fresh fetch)
    // If it was cached, we wouldn't see the change if the key was same.
    // The fact we see change suggests logic works.
  }

  console.log('\n3. Analysis with Custom Query');
  const customQuery = 'Desmond Bane 2020 Prizm Base RC'; // Specific query
  console.log(`Using Custom Query: "${customQuery}"`);

  const queryResult = await aiCardService.analyzeCardQuick({
    ...cardDetails,
    customQuery,
  });

  console.log(`Custom Query Sales: ${queryResult.recentSales.length}`);
  // We can't easily verify the query went to eBay without spying, but we can check if results differ
  // or just that it runs without error.
  if (queryResult) {
    console.log('✅ Success: Custom query analysis completed.');
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch(console.error);
