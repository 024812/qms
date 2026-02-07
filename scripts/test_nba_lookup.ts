async function testNBAPlayerLookup() {
  const url =
    'https://stats.nba.com/stats/commonallplayers?IsOnlyCurrentSeason=1&LeagueID=00&Season=2025-26';

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
      return;
    }

    const data = await res.json();
    const rows = data.resultSets[0].rowSet;
    // PERSON_ID is usually index 0, DISPLAY_FIRST_LAST is index 2, Rosterstatus is 3, TeamID is 7... check headers
    const headersList = data.resultSets[0].headers;
    console.log('Headers:', headersList);

    // Debug: Print first 5 rows
    console.log('First 5 rows:', rows.slice(0, 5));

    const idIdx = headersList.indexOf('PERSON_ID');
    const nameIdx = headersList.indexOf('DISPLAY_FIRST_LAST');

    // Try finding by 'zac'
    const target = 'zac';
    const matches = rows.filter((r: any[]) => r[nameIdx].toLowerCase().includes(target));

    if (matches.length > 0) {
      console.log('Found matches for "zac":');
      matches.forEach((m: any[]) => {
        console.log(`- ${m[nameIdx]} (ID: ${m[idIdx]})`);
      });
    } else {
      console.log('No matches for "zac".');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testNBAPlayerLookup();
