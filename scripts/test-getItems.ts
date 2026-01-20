/**
 * Test getItems function
 */

import 'dotenv/config';

async function testGetItems() {
  console.log('🧪 Testing getItems function...\n');

  try {
    // Import the function
    const { getItems } = await import('../src/app/actions/items');
    
    console.log('✓ getItems function imported successfully\n');
    
    // Note: We can't actually call it without a session
    // But we can verify the import works
    console.log('Function signature:', getItems.toString().substring(0, 200) + '...');
    
    console.log('\n✅ Import test passed!');
    console.log('\n💡 The function exists and can be imported.');
    console.log('   The 404 might be a Next.js routing or caching issue.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testGetItems();
