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
  gradingCompany?: string;
  grade?: number;
  isAutographed?: boolean;
  customQuery?: string;
}

export interface eBaySalesResult {
  title: string;
  price: number;
  currency: string;
  date: string;
  url: string;
  image?: string;
}

interface EbayCredentials {
  appId: string;
  certId: string;
}

interface EbayAccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface EbayTokenCache {
  token: string;
  expiresAt: number;
}

interface EbayPriceSummary {
  value?: string;
  currency?: string;
}

interface EbayImageSummary {
  imageUrl?: string;
}

interface EbayItemSummary {
  title?: string;
  price?: EbayPriceSummary;
  itemEndDate?: string;
  itemWebUrl?: string;
  image?: EbayImageSummary;
}

interface EbayBrowseSearchResponse {
  itemSummaries?: EbayItemSummary[];
  total?: number;
}

interface EbayErrorResponse {
  errors?: Array<{
    errorId?: number;
    message?: string;
    longMessage?: string;
  }>;
}

// ============================================================================
// eBay API Client
// ============================================================================

const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';
const EBAY_MARKETPLACE_ID = 'EBAY_US';

export class eBayApiClient {
  private tokenCache: EbayTokenCache | null = null;

  private getApiBaseUrl() {
    return process.env.EBAY_ENVIRONMENT === 'sandbox'
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';
  }

  private async getCredentials(): Promise<EbayCredentials> {
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

    if (!appId || !certId) {
      appId = appId || process.env.App_ID || process.env.EBAY_APP_ID;
      certId = certId || process.env.Cert_ID || process.env.EBAY_CERT_ID;
    }

    if (!appId || !certId) {
      throw new EbayConfigError(
        'eBay API not configured. Please check System Settings or Environment Variables.'
      );
    }

    return { appId, certId };
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60_000) {
      return this.tokenCache.token;
    }

    const { appId, certId } = await this.getCredentials();
    const basicAuth = Buffer.from(`${appId}:${certId}`).toString('base64');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: EBAY_SCOPE,
    });

    const response = await fetch(`${this.getApiBaseUrl()}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = (await response.json()) as EbayAccessTokenResponse;

    if (!response.ok || !data.access_token) {
      throw new EbayConfigError(
        data.error_description || data.error || 'eBay Authentication Failed. Check credentials.'
      );
    }

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(60, (data.expires_in || 7200) - 60) * 1000,
    };

    return this.tokenCache.token;
  }

  private async browseSearch(
    params: Record<string, string | number | undefined>,
    forceRefresh = false
  ): Promise<EbayBrowseSearchResponse> {
    const token = await this.getAccessToken(forceRefresh);
    const url = new URL(`${this.getApiBaseUrl()}/buy/browse/v1/item_summary/search`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': EBAY_MARKETPLACE_ID,
      },
    });

    if ((response.status === 401 || response.status === 403) && !forceRefresh) {
      this.tokenCache = null;
      return this.browseSearch(params, true);
    }

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as EbayErrorResponse | null;
      const message =
        errorData?.errors?.[0]?.longMessage ||
        errorData?.errors?.[0]?.message ||
        `eBay Browse API request failed with status ${response.status}`;

      throw new EbayApiError(message, response.status === 429 || response.status >= 500);
    }

    return (await response.json()) as EbayBrowseSearchResponse;
  }

  /**
   * Search specifically for SOLD listings (Completed Sales)
   * @returns Empty array on transient errors, throws on config errors
   * @throws {EbayConfigError} if API is not configured
   */
  async searchSoldListings(params: eBaySearchParams): Promise<eBaySalesResult[]> {
    try {
      const performSearch = async (currentParams: eBaySearchParams): Promise<EbayItemSummary[]> => {
        const q = currentParams.customQuery
          ? currentParams.customQuery
          : this.buildSearchQuery(currentParams);
        console.warn('DEBUG: Generated Query:', q);

        const response = await this.browseSearch({
          q,
          filter: 'soldItemsOnly:true',
          sort: 'createdDate:DESC',
          limit: 50,
          fieldgroups: 'ITEM_SUMMARY,PRICE',
        });

        return response.itemSummaries || [];
      };

      let itemSummaries = await performSearch(params);

      if (itemSummaries.length === 0 && params.year && !params.customQuery) {
        console.warn('DEBUG: No results found. Retrying without YEAR...');
        const paramsNoYear = { ...params };
        delete paramsNoYear.year;
        itemSummaries = await performSearch(paramsNoYear);
      }

      if (itemSummaries.length === 0 && params.series && !params.customQuery) {
        console.warn('DEBUG: No results found. Retrying without SERIES...');
        const paramsNoSeries = { ...params };
        delete paramsNoSeries.series;
        itemSummaries = await performSearch(paramsNoSeries);
      }

      if (itemSummaries.length === 0) {
        return [];
      }

      const filteredSummaries = itemSummaries.filter(item => {
        const title = (item.title || '').toLowerCase();
        const negatives = [
          'reprint',
          'rp',
          'facsimile',
          'digital',
          'lot',
          'set',
          'box',
          'pack',
          'case',
          'break',
        ];

        return !negatives.some(neg => title.includes(neg));
      });

      console.warn(
        `DEBUG: Unfiltered count: ${itemSummaries.length}, Filtered count: ${filteredSummaries.length}`
      );

      if (filteredSummaries.length === 0 && itemSummaries.length > 0) {
        console.warn('DEBUG: All results were filtered out as junk. Returning empty.');
        return [];
      }

      return filteredSummaries.map(item => {
        const priceValue = parseFloat(item.price?.value || '0');
        const priceCurrency = item.price?.currency || 'USD';
        const normalizedPrice = this.normalizeCurrency(priceValue, priceCurrency);

        return {
          title: item.title ?? '',
          price: normalizedPrice,
          currency: 'USD',
          date: item.itemEndDate || new Date().toISOString(),
          url: item.itemWebUrl ?? '',
          image: item.image?.imageUrl,
        };
      });
    } catch (error) {
      if (error instanceof EbayConfigError) {
        throw error;
      }

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
      const q = params.customQuery ? params.customQuery : this.buildSearchQuery(params);
      const response = await this.browseSearch({
        q,
        limit: 1,
      });

      return response.total || 0;
    } catch (error) {
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

    if (params.year) parts.push(String(params.year));
    parts.push(params.playerName);

    if (params.brand) parts.push(params.brand);
    if (params.series) parts.push(params.series);
    if (params.cardNum) parts.push(params.cardNum);
    if (params.parallel) parts.push(params.parallel);

    if (params.gradingCompany && params.gradingCompany !== 'UNGRADED') {
      parts.push(params.gradingCompany);
      if (params.grade) parts.push(String(params.grade));
    }

    if (params.isAutographed) {
      parts.push('auto');
    }

    return parts.join(' ');
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
   * Reset the cached token (useful for testing or credential refresh)
   */
  resetClient(): void {
    this.tokenCache = null;
  }
}

export const ebayClient = new eBayApiClient();
