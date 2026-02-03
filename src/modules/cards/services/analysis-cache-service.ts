// import { db } from '@/db';
// import { analysisCache } from '@/db/schema';
// import { eq, lt } from 'drizzle-orm';

/**
 * Persistent cache service for card analysis results
 * Uses database storage for cache survival across server restarts
 */
class AnalysisCacheService {
  private readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get a cached analysis result by key
   * @returns The cached result or null if not found/expired
   */
  async get<T>(_key: string): Promise<T | null> {
    // Disabled temporarily
    return null;
    /*
    try {
      const result = await db
        .select()
        .from(analysisCache)
        .where(eq(analysisCache.cacheKey, key))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const entry = result[0];

      // Check expiration
      if (new Date() > entry.expiresAt) {
        // Expired - delete and return null
        await this.delete(key);
        return null;
      }

      return entry.result as T;
    } catch (error) {
      console.error('AnalysisCacheService.get error:', error);
      return null;
    }
    */
  }

  /**
   * Set a cached analysis result
   * @param key - Cache key
   * @param value - The value to cache
   * @param ttlMs - Time-to-live in milliseconds (default: 24 hours)
   */
  async set<T extends Record<string, unknown>>(
    key: string,
    value: T,
    _ttlMs: number = this.DEFAULT_TTL_MS
  ): Promise<void> {
    try {
      /*
       * TODO: Re-enable DB cache once migration synchronization issue on Vercel is resolved.
       * Currently disabled to prevent "relation does not exist" errors in logs.
       */
      // const expiresAt = new Date(Date.now() + ttlMs);
      // await db
      //   .insert(analysisCache)
      //   .values({
      //     cacheKey: key,
      //     result: value,
      //     expiresAt,
      //   })
      //   .onConflictDoUpdate({
      //     target: analysisCache.cacheKey,
      //     set: {
      //       result: value,
      //       expiresAt,
      //     },
      //   });
      return;
    } catch (error) {
      console.error('AnalysisCacheService.set error:', error);
      // Don't throw - cache failures should not break the main flow
    }
  }

  /**
   * Delete a cached entry
   */
  async delete(_key: string): Promise<void> {
    // Disabled temporarily
    return;
    /*
    try {
      await db.delete(analysisCache).where(eq(analysisCache.cacheKey, key));
    } catch (error) {
      console.error('AnalysisCacheService.delete error:', error);
    }
    */
  }

  /**
   * Clean up expired entries
   * Should be run periodically (e.g., via cron job)
   */
  async cleanup(): Promise<number> {
    // Disabled temporarily
    return 0;
    /*
    try {
      // Delete entries where expiresAt < now (expired)
      const result = await db.delete(analysisCache).where(lt(analysisCache.expiresAt, new Date()));
      return result.rowCount ?? 0;
    } catch (error) {
      console.error('AnalysisCacheService.cleanup error:', error);
      return 0;
    }
    */
  }
}

export const analysisCacheService = new AnalysisCacheService();
