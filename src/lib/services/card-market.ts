/**
 * Card Market Data Service
 *
 * Fetches market data for sports cards from various sources
 */

export interface MarketData {
  averagePrice: number;
  recentSales: SaleRecord[];
  priceRange: {
    low: number;
    high: number;
  };
  lastUpdated: Date;
}

export interface SaleRecord {
  price: number;
  date: Date;
  condition: string;
  source: string;
}

/**
 * Generate search query for card
 */
export function generateCardSearchQuery(card: {
  playerName: string;
  year: number;
  brand: string;
  series?: string;
  cardNumber?: string;
  parallel?: string;
  gradingCompany?: string;
  grade?: number;
}): string {
  const parts = [
    card.year,
    card.brand,
    card.playerName,
    card.series,
    card.parallel,
    card.cardNumber,
  ].filter(Boolean);

  if (card.gradingCompany && card.gradingCompany !== 'UNGRADED' && card.grade) {
    parts.push(`${card.gradingCompany} ${card.grade}`);
  }

  return parts.join(' ');
}

/**
 * Get eBay search URL for card
 */
export function getEbaySearchUrl(searchQuery: string): string {
  const params = new URLSearchParams({
    _nkw: searchQuery,
    _sop: '13', // Sort by price + shipping: lowest first
    LH_Sold: '1', // Sold listings
    LH_Complete: '1', // Completed listings
  });

  return `https://www.ebay.com/sch/i.html?${params.toString()}`;
}

/**
 * Get PSA CardFacts URL
 */
export function getPSACardFactsUrl(card: {
  playerName: string;
  year: number;
  brand: string;
}): string {
  const searchQuery = `${card.year} ${card.brand} ${card.playerName}`;
  return `https://www.psacard.com/cardfacts/search?q=${encodeURIComponent(searchQuery)}`;
}

/**
 * Get Beckett search URL
 */
export function getBeckettSearchUrl(searchQuery: string): string {
  return `https://www.beckett.com/search?q=${encodeURIComponent(searchQuery)}`;
}

/**
 * Get 130point.com price guide URL
 */
export function get130PointUrl(card: { playerName: string; year: number; brand: string }): string {
  const searchQuery = `${card.year} ${card.brand} ${card.playerName}`;
  return `https://130point.com/sales/?q=${encodeURIComponent(searchQuery)}`;
}

/**
 * Mock market data (for demonstration)
 * In production, this would call real APIs
 */
export async function fetchMarketData(_searchQuery: string): Promise<MarketData | null> {
  // This is a placeholder. In production, you would:
  // 1. Call eBay API with authentication
  // 2. Parse the response
  // 3. Calculate statistics

  // For now, return null to indicate no data available
  // The UI will show external links instead
  return null;
}

/**
 * Estimate card value based on similar cards
 */
export function estimateCardValue(card: {
  year: number;
  gradingCompany?: string;
  grade?: number;
  isAutographed?: boolean;
  hasMemorabilia?: boolean;
}): { low: number; high: number; estimated: number } | null {
  // Basic estimation logic
  // This is very simplified - real estimation would use ML models

  if (!card.gradingCompany || card.gradingCompany === 'UNGRADED') {
    return {
      low: 5,
      high: 50,
      estimated: 20,
    };
  }

  const grade = card.grade || 0;
  let baseValue = 50;

  // Grade multiplier
  if (grade >= 9.5) {
    baseValue *= 10;
  } else if (grade >= 9) {
    baseValue *= 5;
  } else if (grade >= 8) {
    baseValue *= 2;
  }

  // Special features
  if (card.isAutographed) {
    baseValue *= 2;
  }
  if (card.hasMemorabilia) {
    baseValue *= 1.5;
  }

  // Age factor
  const age = new Date().getFullYear() - card.year;
  if (age > 30) {
    baseValue *= 1.5;
  }

  return {
    low: Math.round(baseValue * 0.7),
    high: Math.round(baseValue * 1.5),
    estimated: Math.round(baseValue),
  };
}
