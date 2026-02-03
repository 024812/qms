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
  customQuery?: string;
}

export interface IPriceDataProvider {
  name: string;
  getRecentSales(details: CardDetails): Promise<eBaySalesResult[]>;
  getActiveListingCount(details: CardDetails): Promise<number>;
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
      customQuery: details.customQuery,
    });
  }

  async getActiveListingCount(details: CardDetails): Promise<number> {
    return await ebayClient.getActiveListingsCount({
      playerName: details.playerName,
      year: details.year,
      brand: details.brand,
      series: details.series,
      cardNum: details.cardNumber,
      gradingCompany: details.gradingCompany,
      grade: details.grade, // Note: active listings might not always have grade populated in the same field, but search query handles it
      isAutographed: details.isAutographed,
      customQuery: details.customQuery,
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

  async getActiveListingCount(_details: CardDetails): Promise<number> {
    return 0; // Not supported or implemented yet
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

  async getActiveListingCount(details: CardDetails): Promise<number> {
    // We can cache this too, maybe for a shorter time or same? Let's use same for simplicity.
    // const key = `active_${this.generateCacheKey(details)}`;
    // We need a separate cache or reuse the map with a different structure.
    // Since map stores { data: eBaySalesResult[] }, we can't easily reuse it without changing type.
    // For MVP/Phase 2, let's just fetch live or use a separate simple map if strictly needed.
    // Given the request volume, live is acceptable for "depth", but caching is better.
    return await this.provider.getActiveListingCount(details);
  }

  private generateCacheKey(details: CardDetails): string {
    return `${details.year}|${details.playerName}|${details.brand}|${details.cardNumber}|${details.grade}|${details.customQuery || ''}`;
  }
}

// Export Singleton Instances
export const ebayProvider = new CachingPriceProvider(new EbayPriceProvider());
export const web130Provider = new CachingPriceProvider(new Web130PointProvider());
