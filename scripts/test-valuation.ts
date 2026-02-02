import dotenv from 'dotenv';
import { aiCardService } from '../src/modules/cards/services/ai-card-service';
import { ebayClient } from '../src/modules/cards/services/ebay-api-client';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function testValuation() {
  console.log('--- Testing Price Estimation ---');

  // 1. Test Case: Well-known card (should have data)
  const mockCard = {
    playerName: 'LeBron James',
    year: 2003,
    brand: 'Topps',
    series: 'Chrome', // Specific
    cardNumber: '111',
    gradingCompany: 'PSA',
    grade: 10,
    isAutographed: false,
  };

  console.log('Mock Card:', mockCard);

  try {
    // Direct eBay Client Check to see raw results
    console.log('\n1. Testing eBay Client Search directly...');
    const searchResults = await ebayClient.searchSoldListings({
      playerName: mockCard.playerName,
      year: mockCard.year,
      brand: mockCard.brand,
      cardNum: mockCard.cardNumber,
      gradingCompany: mockCard.gradingCompany,
      grade: mockCard.grade,
      isAutographed: mockCard.isAutographed,
    });
    console.log(`Found ${searchResults.length} raw results via eBay Client.`);
    if (searchResults.length > 0) {
      console.log('First result:', searchResults[0]);
    }

    // Service Logic Check
    console.log('\n2. Testing AICardService.estimatePrice...');
    const estimate = await aiCardService.estimatePrice(mockCard);

    console.log('Estimate Result:', JSON.stringify(estimate, null, 2));
  } catch (error: any) {
    console.error('Test Failed:', error);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

testValuation();
