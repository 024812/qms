const RAPID_API_KEY = '6fb4eda8c6msh5254c4c4f9ac8dcp1532e1jsndc3c334d08c5';
const HOST = 'api-nba.p.rapidapi.com';

async function testRapidApi() {
  console.log('Testing RapidAPI (API-NBA)...');

  // 1. Search for Player "Zaccharie Risacher"
  // Note: API-NBA might spell it differently or have different IDs.
  const searchUrl = `https://${HOST}/players?search=Risacher`;

  const headers = {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': HOST,
  };

  try {
    console.log(`Searching: ${searchUrl}`);
    const res = await fetch(searchUrl, { headers });

    if (!res.ok) {
      console.error(`Status: ${res.status}`);
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    console.log('Search Results:', JSON.stringify(data.response, null, 2));

    if (data.response && data.response.length > 0) {
      const player = data.response[0];
      console.log(`Found Player ID: ${player.id}`);

      // 2. Fetch Stats for 2025 season (API-NBA uses 2024 for 2024-25 usually)
      const statsUrl = `https://${HOST}/players/statistics?id=${player.id}&season=2024`;
      console.log(`Fetching Stats: ${statsUrl}`);

      const statsRes = await fetch(statsUrl, { headers });
      const statsData = await statsRes.json();

      // API-NBA returns all games, we take last 5
      const games = statsData.response.slice(-5);
      console.log(`Retrieved ${games.length} recent games.`);
      if (games.length > 0) {
        console.log('Last Game:', JSON.stringify(games[games.length - 1], null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

testRapidApi();
