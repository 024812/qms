// @ts-nocheck
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from './local-db';
import { cards } from '../src/db/schema';
import { aiCardService } from '../src/modules/cards/services/ai-card-service';
// import { desc } from 'drizzle-orm';

async function generateGradingReport() {
  console.log('🔍 Generating Grading Analysis Report...');
  console.log('Node Version:', process.version);
  console.log('DATABASE_URL Present:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
  }

  try {
    // 1. Fetch a card from DB
    console.log('Fetching a card from database...');
    const allCards = await db.select().from(cards).limit(5); // Fetch a few to find a good candidate

    if (allCards.length === 0) {
      console.error('❌ No cards found in the database. Please add a card first.');
      process.exit(1);
    }

    // Try to find a card with enough info (Player + Year + Brand)
    const card = allCards.find(c => c.playerName && c.year && c.brand) || allCards[0];

    console.log(
      `\n📋 Selected Card: ${card.playerName} (${card.year} ${card.brand} ${card.series || ''} #${card.itemNumber || 'N/A'})`
    );
    console.log(`   ID: ${card.id}`);

    // 2. Run Grading Analysis
    console.log('\n🚀 Running AICardService.analyzeGradingPotential...');
    const startTime = Date.now();

    const result = await aiCardService.analyzeGradingPotential({
      playerName: card.playerName || '',
      year: card.year || undefined,
      brand: card.brand || undefined,
      series: card.series || undefined,
      // @ts-ignore
      // cardNumber: (card.cardNumber || undefined) as any,
      grade: card.grade || undefined,
      gradingCompany: card.gradingCompany || undefined,
    });

    const duration = Date.now() - startTime;

    // 3. Print Report
    console.log('\n' + '='.repeat(50));
    console.log('       GRADING ANALYSIS REPORT');
    console.log('='.repeat(50));
    console.log(`Analyzed in: ${duration}ms`);
    console.log(`Recommendation: ${result.recommendation} 🟢🟡🔴`);

    console.log('\n--- Valuation Breakdown ---');
    console.log(`Raw Price   : $${result.rawPrice.toFixed(2)}`);
    console.log(
      `PSA 9 Price : $${result.psa9Price?.toFixed(2) || 'N/A'} (ROI: ${result.psa9Roi}%)`
    );
    console.log(
      `PSA 10 Price: $${result.psa10Price?.toFixed(2) || 'N/A'} (ROI: ${result.psa10Roi}%)`
    );

    console.log('\n--- Market Depth ---');
    console.log(`Active Listings: ${result.marketDepth.activeListings} (Supply)`);
    // console.log(`Recent Sales   : ${result.marketDepth.recentSales} (Demand)`);
    // console.log(`Vol/List Ratio : ${result.marketDepth.salesToActiveRatio.toFixed(2)}`);
    // console.log(`Market Sentiment: ${result.marketDepth.volatility}`);
    // Checking interface: GradingAnalysisResult has marketDepth: { activeListings, recentSales, volatility, salesToActiveRatio }

    console.log('\n--- Analysis Logic ---');
    console.log(
      'Criteria for GRADE: ROI > 20% on PSA 10 *probability adjusted* or PSA 9 ROI > 10%'
    );
    console.log('Criteria for SELL_RAW: ROI < 0 or too much supply');

    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Analysis Failed:');
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }
  }
}

generateGradingReport();
