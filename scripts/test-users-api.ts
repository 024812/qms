/**
 * Test script to debug users API
 */

async function testUsersAPI() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log('Testing GET /api/users...');
  console.log('Base URL:', baseUrl);
  
  try {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.users) {
      console.log(`\nFound ${data.users.length} users:`);
      data.users.forEach((user: any) => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testUsersAPI();
