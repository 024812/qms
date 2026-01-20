/**
 * Card Repository
 *
 * Handles all database operations for sports cards with type safety and proper error handling.
 * Uses Drizzle ORM with the independent cards table architecture.
 *
 * Requirements: 5.3, 5.4, 5.6 - Type-safe database operations with Drizzle ORM
 */

import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import type { Card } from '@/db/schema';
import { dbLogger } from '@/lib/logger';

/**
 * Card Repository Class
 *
 * Provides type-safe database operations for the cards table using Drizzle ORM.
 * All methods use Drizzle's type inference for compile-time type safety.
 */
export class CardRepository {
  /**
   * Find all cards for a specific user
   *
   * @param userId - User ID to filter cards
   * @returns Array of Card records ordered by item number (descending)
   *
   * Requirements: 5.3, 5.4 - Database queries with Drizzle ORM
   */
  async findAll(userId: string): Promise<Card[]> {
    try {
      dbLogger.info('Finding all cards for user', { userId });

      const result = await db
        .select()
        .from(cards)
        .where(eq(cards.userId, userId))
        .orderBy(desc(cards.itemNumber));

      dbLogger.info('Cards found', { userId, count: result.length });
      return result;
    } catch (error) {
      dbLogger.error('Error finding cards', { userId, error });
      throw error;
    }
  }

  /**
   * Find a card by ID
   *
   * @param id - Card ID
   * @returns Card record or null if not found
   *
   * Requirements: 5.3, 5.4 - Database queries with Drizzle ORM
   */
  async findById(id: string): Promise<Card | null> {
    try {
      dbLogger.info('Finding card by ID', { id });

      const result = await db.select().from(cards).where(eq(cards.id, id)).limit(1);

      const card = result[0] || null;
      dbLogger.info('Card found', { id, found: !!card });
      return card;
    } catch (error) {
      dbLogger.error('Error finding card by ID', { id, error });
      throw error;
    }
  }

  /**
   * Find cards by sport type
   *
   * @param userId - User ID to filter cards
   * @param sport - Sport type (BASKETBALL, SOCCER, OTHER)
   * @returns Array of Card records ordered by grade (descending)
   *
   * Requirements: 5.3, 5.4 - Database queries with filtering
   */
  async findBySport(userId: string, sport: 'BASKETBALL' | 'SOCCER' | 'OTHER'): Promise<Card[]> {
    try {
      dbLogger.info('Finding cards by sport', { userId, sport });

      const result = await db
        .select()
        .from(cards)
        .where(and(eq(cards.userId, userId), eq(cards.sport, sport)))
        .orderBy(desc(cards.grade));

      dbLogger.info('Cards found by sport', { userId, sport, count: result.length });
      return result;
    } catch (error) {
      dbLogger.error('Error finding cards by sport', { userId, sport, error });
      throw error;
    }
  }

  /**
   * Find cards by minimum grade
   *
   * @param userId - User ID to filter cards
   * @param minGrade - Minimum grade value
   * @returns Array of Card records ordered by grade (descending)
   *
   * Requirements: 5.3, 5.4 - Database queries with filtering
   */
  async findByGrade(userId: string, minGrade: number): Promise<Card[]> {
    try {
      dbLogger.info('Finding cards by grade', { userId, minGrade });

      const result = await db
        .select()
        .from(cards)
        .where(and(eq(cards.userId, userId), gte(cards.grade, minGrade.toString())))
        .orderBy(desc(cards.grade));

      dbLogger.info('Cards found by grade', { userId, minGrade, count: result.length });
      return result;
    } catch (error) {
      dbLogger.error('Error finding cards by grade', { userId, minGrade, error });
      throw error;
    }
  }

  /**
   * Find cards by status
   *
   * @param userId - User ID to filter cards
   * @param status - Card status (COLLECTION, FOR_SALE, SOLD, GRADING, DISPLAY)
   * @returns Array of Card records ordered by item number (descending)
   *
   * Requirements: 5.3, 5.4 - Database queries with filtering
   */
  async findByStatus(
    userId: string,
    status: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY'
  ): Promise<Card[]> {
    try {
      dbLogger.info('Finding cards by status', { userId, status });

      const result = await db
        .select()
        .from(cards)
        .where(and(eq(cards.userId, userId), eq(cards.status, status)))
        .orderBy(desc(cards.itemNumber));

      dbLogger.info('Cards found by status', { userId, status, count: result.length });
      return result;
    } catch (error) {
      dbLogger.error('Error finding cards by status', { userId, status, error });
      throw error;
    }
  }

  /**
   * Get total count of cards for a user
   *
   * @param userId - User ID
   * @returns Total number of cards
   *
   * Requirements: 5.3, 5.4 - Database aggregation queries
   */
  async count(userId: string): Promise<number> {
    try {
      dbLogger.info('Counting cards for user', { userId });

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(cards)
        .where(eq(cards.userId, userId));

      const count = Number(result[0]?.count || 0);
      dbLogger.info('Cards counted', { userId, count });
      return count;
    } catch (error) {
      dbLogger.error('Error counting cards', { userId, error });
      throw error;
    }
  }
}

/**
 * Singleton instance of CardRepository
 *
 * Export a single instance to be used throughout the application.
 */
export const cardRepository = new CardRepository();
