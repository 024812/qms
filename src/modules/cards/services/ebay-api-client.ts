import eBayApi from '@hendt/ebay-api';
import { systemSettingsRepository } from '@/lib/repositories/system-settings.repository';

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Configuration error - requires user intervention
 * Thrown when eBay API credentials are missing or invalid.
 */
export class EbayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EbayConfigError';
  }
}

/**
 * API error - may be transient or permanent
 * Includes a flag indicating whether the error is retryable.
 */
export class EbayApiError extends Error {
  constructor(
    message: string,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'EbayApiError';
  }
}

// ============================================================================
// Types
// ============================================================================

export interface eBaySearchParams {
  playerName: string;
  year?: number;
  brand?: string;
  series?: string;
  cardNum?: string;
  parallel?: string;
  gradingCompany?: string; // PSA, BGS, SGC, etc.
  grade?: number; // 9, 10, etc.
  isAutographed?: boolean;
  customQuery?: string;
}

export interface eBaySalesResult {
  title: string;
  price: number;
  currency: string;
  date: string; // ISO string
  url: string;
  image?: string;
}

// ============================================================================
// eBay API Client
// ============================================================================

export class eBayApiClient {
  private client: eBayApi | null = null;

  constructor() {}

  /**
   * Initialize or retrieve the eBay SDK client
   * @throws {EbayConfigError} if credentials are missing
   * @throws {EbayApiError} if authentication fails
   */
  private async getClient(): Promise<eBayApi> {
    if (this.client) {
      return this.client;
    }

    // 1. Get credentials from DB (Safe fetch)
    let config = null;
    try {
      config = await systemSettingsRepository.getEbayApiConfig();
    } catch (error) {
      console.warn(
        'eBay Client: Failed to fetch settings from DB, proceeding to env fallback.',
        error
      );
    }

    let appId = config?.appId || undefined;
    let certId = config?.certId || undefined;
    let devId = config?.devId || undefined; // Optional

    // 2. Fallback to Env Vars if DB is missing
    if (!appId || !certId) {
      if (process.env.App_ID) appId = process.env.App_ID;
      if (process.env.EBAY_APP_ID) appId = process.env.EBAY_APP_ID;

      if (process.env.Cert_ID) certId = process.env.Cert_ID;
      if (process.env.EBAY_CERT_ID) certId = process.env.EBAY_CERT_ID;

      if (process.env.Dev_ID) devId = process.env.Dev_ID;
      if (process.env.EBAY_DEV_ID) devId = process.env.EBAY_DEV_ID;
    }

    if (!appId || !certId) {
      throw new EbayConfigError(
        'eBay API not configured. Please check System Settings or Environment Variables.'
      );
    }

    // 3. Initialize Client
    const isSandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';

    this.client = new eBayApi({
      appId: appId,
      certId: certId,
      devId: devId,
      sandbox: isSandbox,
      siteId: eBayApi.SiteId.EBAY_US,
      marketplaceId: eBayApi.MarketplaceId.EBAY_US,
      autoRefreshToken: true,
    });

    // 4. Authenticate (Client Credentials Flow)
    try {
      this.client.OAuth2.setScope(['https://api.ebay.com/oauth/api_scope']);
      await this.client.OAuth2.getApplicationAccessToken();
    } catch (error) {
      console.error('eBay Auth Failed:', error);
      // Auth failures are usually config issues (wrong credentials)
      throw new EbayConfigError('eBay Authentication Failed. Check credentials.');
    }

    return this.client;
  }

  /**
   * Search specifically for SOLD listings (Completed Sales)
   * @returns Empty array on transient errors, throws on config errors
   * @throws {EbayConfigError} if API is not configured
   */
  async searchSoldListings(params: eBaySearchParams): Promise<eBaySalesResult[]> {
    try {
      const client = await this.getClient();

      // Build optimal search query
      const q = params.customQuery ? params.customQuery : this.buildSearchQuery(params);

      // Execute Search
      const response = await client.buy.browse.search({
        q: q,
        filter: 'soldItemsOnly:true',
        sort: 'createdDate:DESC',
        limit: 20,
        fieldgroups: 'ITEM_SUMMARY,PRICE',
      });

      if (!response.itemSummaries) {
        return [];
      }

      // Transform results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.itemSummaries.map((item: any) => {
        const priceValue = parseFloat(item.price?.value || '0');
        const priceCurrency = item.price?.currency || 'USD';
        const normalizedPrice = this.normalizeCurrency(priceValue, priceCurrency);

        return {
          title: item.title,
          price: normalizedPrice,
          currency: 'USD',
          date: item.itemEndDate || new Date().toISOString(),
          url: item.itemWebUrl,
          image: item.image?.imageUrl,
        };
      });
    } catch (error) {
      // Re-throw configuration errors - caller must handle
      if (error instanceof EbayConfigError) {
        throw error;
      }

      // Log and suppress transient API errors
      console.error('eBay API Search Error:', error);
      return [];
    }
  }

  /**
   * Search for ACTIVE listings to gauge market depth (Supply)
   * @returns 0 on any error
   */
  async getActiveListingsCount(params: eBaySearchParams): Promise<number> {
    try {
      const client = await this.getClient();
      const q = params.customQuery ? params.customQuery : this.buildSearchQuery(params);

      const response = await client.buy.browse.search({
        q: q,
        limit: 1,
      });

      return response.total || 0;
    } catch (error) {
      // Config errors are logged but return 0 (graceful degradation for count)
      if (error instanceof EbayConfigError) {
        console.warn('eBay not configured for active listings count:', error.message);
      } else {
        console.error('eBay Active Search Error:', error);
      }
      return 0;
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
    if (params.series) parts.push(params.series);

    // Card Number is very specific
    if (params.cardNum) parts.push(`#${params.cardNum}`);

    // Parallel/Variation
    if (params.parallel) parts.push(params.parallel);

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
      '-facsimile',
      '-digital',
      '-lot',
      '-set',
      '-box',
      '-pack',
      '-case',
      '-break',
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

  /**
   * Reset the client (useful for testing or credential refresh)
   */
  resetClient(): void {
    this.client = null;
  }
}

export const ebayClient = new eBayApiClient();
