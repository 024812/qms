import eBayApi from '@hendt/ebay-api';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

// Types for search parameters
export interface eBaySearchParams {
  playerName: string;
  year?: number;
  brand?: string;
  series?: string;
  cardNum?: string;
  gradingCompany?: string; // PSA, BGS, SGC, etc.
  grade?: number; // 9, 10, etc.
  isAutographed?: boolean;
}

export interface eBaySalesResult {
  title: string;
  price: number;
  currency: string;
  date: string; // ISO string
  url: string;
  image?: string;
}

export class eBayApiClient {
  private client: eBayApi | null = null;

  constructor() {}

  /**
   * Initialize or retrieve the eBay SDK client
   */
  private async getClient(): Promise<eBayApi> {
    if (this.client) {
      // Check if token is potentially expired (simplified check)
      // In real app, the SDK might handle auto-refresh if config.autoRefreshToken is true
      // But we need to ensure we have a token first.
      return this.client;
    }

    // 1. Get credentials from DB
    const config = await systemSettingsRepository.getEbayApiConfig();

    if (!config?.appId || !config?.certId) {
      // Return null or throw. Throwing is safer to alert the user.
      throw new Error('eBay API not configured. Please check System Settings.');
    }

    // 2. Initialize Client
    this.client = new eBayApi({
      appId: config.appId,
      certId: config.certId,
      sandbox: false, // Production
      siteId: eBayApi.SiteId.EBAY_US,
      marketplaceId: eBayApi.MarketplaceId.EBAY_US,
      autoRefreshToken: true,
    });

    // 3. Authenticate (Client Credentials Flow)
    try {
      this.client.OAuth2.setScope(['https://api.ebay.com/oauth/api-scope/buy.browse']);
      await this.client.OAuth2.getApplicationAccessToken();
    } catch (error) {
      console.error('eBay Auth Failed:', error);
      throw new Error('eBay Authentication Failed. Check credentials.');
    }

    return this.client;
  }

  /**
   * Search specifically for SOLD listings (Completed Sales)
   */
  async searchSoldListings(params: eBaySearchParams): Promise<eBaySalesResult[]> {
    try {
      const client = await this.getClient();

      // Build optimal search query
      const q = this.buildSearchQuery(params);

      // Execute Search
      // Uses the 'buy' API accessor from the SDK
      const response = await client.buy.browse.search({
        q: q,
        filter: 'soldItemsOnly:true',
        sort: 'createdDate:DESC', // Newest sales first
        limit: 20,
        fieldgroups: 'ITEM_SUMMARY,PRICE',
      });

      if (!response.itemSummaries) {
        return [];
      }

      // Transform results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.itemSummaries.map((item: any) => {
        // Handle price. eBay returns { value: "100.00", currency: "USD" }
        const priceValue = parseFloat(item.price?.value || '0');
        const priceCurrency = item.price?.currency || 'USD';

        const normalizedPrice = this.normalizeCurrency(priceValue, priceCurrency);

        return {
          title: item.title,
          price: normalizedPrice,
          currency: 'USD',
          date: item.itemEndDate || new Date().toISOString(),
          url: item.itemWebUrl, // SDK usually maps snake_case to camelCase
          image: item.image?.imageUrl,
        };
      });
    } catch (error) {
      console.error('eBay API Search Error:', error);
      // Suppress error to allow fallback strategies to work
      return [];
    }
  }

  /**
   * Construct a robust search query with Negative Keywords
   */
  private buildSearchQuery(params: eBaySearchParams): string {
    const parts: string[] = [];

    // Core: Year Player Brand
    if (params.year) parts.push(String(params.year));
    parts.push(params.playerName);
    if (params.brand) parts.push(params.brand);
    // Series often causes issues if too specific, keeping it optional
    if (params.series) parts.push(params.series);

    // Card Number is very specific
    if (params.cardNum) parts.push(`#${params.cardNum}`);

    // Grading
    if (params.gradingCompany && params.gradingCompany !== 'UNGRADED') {
      parts.push(params.gradingCompany);
      if (params.grade) parts.push(String(params.grade));
    }

    // Autograph
    if (params.isAutographed) {
      parts.push('auto');
    }

    // NEGATIVE KEYWORDS (Crucial for data cleaning)
    const negatives = [
      '-reprint',
      '-RP',
      '-facsimile', // Fake/Reprint
      '-digital', // Digital cards
      '-lot',
      '-set', // Bulk
      '-box',
      '-pack',
      '-case', // Sealed product
      '-break', // Box breaks
    ];

    return `${parts.join(' ')} ${negatives.join(' ')}`;
  }

  /**
   * Simple Currency Converter
   */
  private normalizeCurrency(value: number, currency: string): number {
    if (currency === 'USD') return value;

    const rates: Record<string, number> = {
      CAD: 0.74,
      AUD: 0.65,
      GBP: 1.27,
      EUR: 1.08,
      JPY: 0.0067,
    };

    const rate = rates[currency];
    if (rate) {
      return Number((value * rate).toFixed(2));
    }

    return value;
  }
}

export const ebayClient = new eBayApiClient();
