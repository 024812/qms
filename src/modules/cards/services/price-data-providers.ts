import { ebayClient, eBaySalesResult } from './ebay-api-client';
export type { eBaySalesResult };

export interface CardDetails {
  playerName: string;
  year?: number;
  brand?: string;
  series?: string;
  cardNumber?: string;
  gradingCompany?: string;
  grade?: number;
  isAutographed?: boolean;
}

export interface IPriceDataProvider {
  name: string;
  getRecentSales(details: CardDetails): Promise<eBaySalesResult[]>;
}

/**
 * eBay Provider
 * Primary source for sold listings
 */
export class EbayPriceProvider implements IPriceDataProvider {
  name = 'eBay';

  async getRecentSales(details: CardDetails): Promise<eBaySalesResult[]> {
    return await ebayClient.searchSoldListings({
      playerName: details.playerName,
      year: details.year,
      brand: details.brand,
      series: details.series,
      cardNum: details.cardNumber,
      gradingCompany: details.gradingCompany,
      grade: details.grade,
      isAutographed: details.isAutographed,
    });
  }
}

/**
 * 130 Point Provider (Web Scraper / Fallback)
 * TODO: Implement actual scraper if needed. Currently a placeholder.
 */
export class Web130PointProvider implements IPriceDataProvider {
  name = '130Point';

  async getRecentSales(details: CardDetails): Promise<eBaySalesResult[]> {
    // Placeholder: In real implementation this would call a Next.js API route
    // that uses Puppeteer/Playwright to scrape 130point.com
    console.warn('130Point provider called for', details.playerName);
    return [];
  }
}

/**
 * Caching Wrapper
 * Caches results for 24 hours to save API calls
 */
export class CachingPriceProvider implements IPriceDataProvider {
  private provider: IPriceDataProvider;
  private cache = new Map<string, { timestamp: number; data: eBaySalesResult[] }>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(provider: IPriceDataProvider) {
    this.provider = provider;
  }

  get name() {
    return this.provider.name;
  }

  async getRecentSales(details: CardDetails): Promise<eBaySalesResult[]> {
    const key = this.generateCacheKey(details);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      // console.log(`Returning cached results for ${this.provider.name}`);
      return cached.data;
    }

    const results = await this.provider.getRecentSales(details);

    // Only cache if we got results
    if (results.length > 0) {
      this.cache.set(key, { timestamp: Date.now(), data: results });
    }

    return results;
  }

  private generateCacheKey(details: CardDetails): string {
    return `${details.year}|${details.playerName}|${details.brand}|${details.cardNumber}|${details.grade}`;
  }
}

// Export Singleton Instances
export const ebayProvider = new CachingPriceProvider(new EbayPriceProvider());
export const web130Provider = new CachingPriceProvider(new Web130PointProvider());
