const API_KEY = 'f0dc8f31-8c5e-4d1c-8c07-6f75d28f0971';

async function testBalldontlie() {
  const headers = { Authorization: API_KEY };

  // 1. Search for Player
  console.log('Searching for Zaccharie Risacher...');
  const searchUrl = 'https://api.balldontlie.io/v1/players?search=Zaccharie';

  try {
    const searchRes = await fetch(searchUrl, { headers });
    const searchData = await searchRes.json();

    console.log('Search Result:', JSON.stringify(searchData, null, 2));

    if (!searchData.data || searchData.data.length === 0) {
      console.error('Player not found');
      return;
    }

    // Find exact match or take first
    const player =
      searchData.data.find((p: any) => p.last_name === 'Risacher') || searchData.data[0];
    console.log(`Found Player: ${player.first_name} ${player.last_name} (ID: ${player.id})`);

    // 3. Debugging Stats Endpoint
    console.log('--- Debugging Stats Endpoint ---');

    // Try generic stats (no filters)
    const genericStatsUrl = 'https://api.balldontlie.io/v1/stats?per_page=1';
    console.log(`Trying generic stats: ${genericStatsUrl}`);
    const res1 = await fetch(genericStatsUrl, { headers });
    console.log(`Generic Stats Status: ${res1.status}`);
    if (!res1.ok) console.log(await res1.text());

    // Try encoded brackets
    const encodedUrl = `https://api.balldontlie.io/v1/stats?player_ids%5B%5D=${player.id}&per_page=5`;
    console.log(`Trying encoded stats: ${encodedUrl}`);
    const res2 = await fetch(encodedUrl, { headers });
    console.log(`Encoded Stats Status: ${res2.status}`);
    if (res2.ok) {
      const data = await res2.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(await res2.text());
    }

    // 4. Debugging Other Endpoints
    console.log('--- Debugging Other Endpoints ---');

    // Teams
    console.log('Fetching Teams...');
    const teamsRes = await fetch('https://api.balldontlie.io/v1/teams', { headers });
    if (teamsRes.ok) {
      console.log('Teams: Success');
    } else {
      console.log(`Teams Failed: ${teamsRes.status}`);
    }

    // Season Averages
    const avgUrl = `https://api.balldontlie.io/v1/season_averages?season=2024&player_ids[]=${player.id}`;
    console.log(`Fetching Averages: ${avgUrl}`);
    const avgRes = await fetch(avgUrl, { headers });
    if (avgRes.ok) {
      const data = await avgRes.json();
      console.log('Season Averages:', JSON.stringify(data, null, 2));
    } else {
      console.log(`Averages Failed: ${avgRes.status}`);
      console.log(await avgRes.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testBalldontlie();
