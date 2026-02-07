async function testNBAOfficial() {
  const LEBRON_ID = '2544';
  const url = `https://stats.nba.com/stats/playergamelog?PlayerID=${LEBRON_ID}&Season=2024-25&SeasonType=Regular%20Season`;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: 'https://www.nba.com/',
    Origin: 'https://www.nba.com',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
  };

  console.log(`Fetching from: ${url}`);
  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error(`Status: ${res.status} ${res.statusText}`);
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    console.log('Success! Data headers:', data.resultSets[0].headers);
    console.log('First row:', data.resultSets[0].rowSet[0]);
    console.log('Total games:', data.resultSets[0].rowSet.length);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testNBAOfficial();
