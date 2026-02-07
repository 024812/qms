/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching of the route itself

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId'); // e.g., 1642258 for Risacher

  if (!playerId) {
    return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
  }

  const endpoint = 'https://stats.nba.com/stats/playergamelog';
  const params = new URLSearchParams({
    PlayerID: playerId,
    Season: '2025-26',
    SeasonType: 'Regular Season',
  });

  try {
    // Headers to mimic browser behavior
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

    const res = await fetch(`${endpoint}?${params}`, { headers });

    if (!res.ok) {
      throw new Error(`NBA API Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Clean up the messy NBA response format
    const resultSet = data.resultSets ? data.resultSets[0] : null;

    if (!resultSet) {
      return NextResponse.json(
        { error: 'Invalid NBA response format', raw: data },
        { status: 502 }
      );
    }

    const headersList = resultSet.headers;
    const rowSet = resultSet.rowSet;
    const formatted = rowSet.map((row: any[]) =>
      Object.fromEntries(headersList.map((key: string, i: number) => [key, row[i]]))
    );

    return NextResponse.json({
      data: formatted,
      count: formatted.length,
      meta: {
        source: 'stats.nba.com',
        proxied: true,
      },
    });
  } catch (error: any) {
    console.error('[NBA Proxy] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
