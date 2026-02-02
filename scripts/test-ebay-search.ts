import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { ebayClient } from '../src/modules/cards/services/ebay-api-client';
import { systemSettingsRepository } from '../src/lib/repositories/system-settings.repository';

async function testEbayConnection() {
  console.log('Testing eBay API Connection...');
  console.log('Database URL present:', !!process.env.DATABASE_URL);

  try {
    // 1. Check if keys exist in DB
    console.log('Checking database for credentials...');
    const config = await systemSettingsRepository.getEbayApiConfig();

    if (!config.appId || !config.certId) {
      console.error('❌ Error: eBay credentials not found in database.');
      console.log('Please ensure you have saved them in System Settings.');
      process.exit(1);
    }

    console.log('✅ Credentials found in DB.');
    console.log(`   App ID: ${config.appId.substring(0, 5)}...`);

    // 2. Perform a test search
    console.log('\nPerforming test search using eBay API...');
    const query = {
      playerName: 'Michael Jordan',
      year: 1986,
      brand: 'Fleer',
      gradingCompany: 'PSA',
      grade: 8,
    };

    console.log(`Query: ${JSON.stringify(query)}`);

    const results = await ebayClient.searchSoldListings(query);

    if (results.length > 0) {
      console.log(`\n✅ Success! Found ${results.length} results.`);
      console.log('Top result:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('\n⚠️  API connection successful, but no results found for test query.');
      console.log('For Sandbox keys, this is normal (sandbox has no real data).');
      console.log('For Production keys, try a simpler query.');
    }
  } catch (error) {
    console.error('\n❌ connection failed:');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if ((error as any).meta) {
        console.error('Meta:', JSON.stringify((error as any).meta, null, 2));
      }
      if ((error as any).cause) {
        console.error('Cause:', (error as any).cause);
      }
    } else {
      console.error(JSON.stringify(error, null, 2));
    }
    process.exit(1);
  }
}

testEbayConnection();
