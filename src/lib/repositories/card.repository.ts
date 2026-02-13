/**
 * Card Repository
 *
 * Repository pattern implementation for card data access.
 * Follows family-shared data model (no userId isolation by default).
 *
 * Architecture: Based on MODULE_STANDARD.md v1.1
 */

import { db, Tx } from '@/db';
import { cards, type Card, type NewCard } from '@/db/schema';
import { dbLogger } from '@/lib/logger';
import { BaseRepositoryImpl } from './base.repository';
import { eq, and, or, ilike, count, max, desc, asc, sql, type SQL } from 'drizzle-orm';

// Valid sort fields
type CardSortField =
  | 'itemNumber'
  | 'playerName'
  | 'year'
  | 'currentValue'
  | 'createdAt'
  | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export interface CardFilters {
  // Family-shared mode: no userId required
  sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
  gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC';
  status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  search?: string;
  excludeSold?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

export interface CreateCardData {
  playerName: string;
  sport: 'BASKETBALL' | 'SOCCER' | 'OTHER';
  year: number;
  brand: string;
  team?: string | null;
  position?: string | null;
  series?: string | null;
  cardNumber?: string | null;
  gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC' | null;
  grade?: string | null;
  certificationNumber?: string | null;
  purchasePrice?: string | null;
  purchaseDate?: string | null;
  currentValue?: string | null;
  estimatedValue?: string | null;
  soldPrice?: string | null;
  soldDate?: string | null;
  isAutographed?: boolean;
  hasMemorabilia?: boolean;
  memorabiliaType?: string | null;
  parallel?: string | null;
  serialNumber?: string | null;
  status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  location?: string | null;
  condition?: string | null;
  notes?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
  // Optional userId for backward compatibility
  userId?: string;
}

export class CardRepository extends BaseRepositoryImpl<Card, Card> {
  protected tableName = 'cards';

  protected rowToModel(row: Card): Card {
    return row;
  }

  protected modelToRow(model: Partial<Card>): Partial<Card> {
    return model;
  }

  /**
   * Build WHERE clause for filters
   */
  private buildWhereClause(filters: CardFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // Default: exclude SOLD unless explicitly requested
    if (filters.excludeSold !== false && !filters.status) {
      conditions.push(sql`${cards.status} != 'SOLD'`);
    }

    if (filters.status) {
      conditions.push(eq(cards.status, filters.status));
    }

    if (filters.sport) {
      conditions.push(eq(cards.sport, filters.sport));
    }

    if (filters.gradingCompany) {
      conditions.push(eq(cards.gradingCompany, filters.gradingCompany));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(cards.playerName, `%${filters.search}%`),
          ilike(cards.team ?? '', `%${filters.search}%`),
          ilike(cards.brand, `%${filters.search}%`)
        ) ?? sql`false`
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Find a card by ID (family-shared, no userId)
   */
  async findById(id: string, tx?: Tx): Promise<Card | null> {
    const database = tx ?? db;

    return this.executeQuery(
      async () => {
        const result = await database.select().from(cards).where(eq(cards.id, id)).limit(1);
        return result[0] || null;
      },
      'findById',
      { id }
    );
  }

  /**
   * Find all cards with filters
   */
  async findAll(filters: CardFilters = {}, tx?: Tx): Promise<Card[]> {
    const database = tx ?? db;
    const whereClause = this.buildWhereClause(filters);

    // Build sort order
    const sortField = filters.sortBy || 'itemNumber';
    const sortOrder = filters.sortOrder || 'desc';
    const orderBy = sortOrder === 'asc' ? asc(cards[sortField]) : desc(cards[sortField]);

    return this.executeQuery(
      async () => {
        let query = database.select().from(cards);

        if (whereClause) {
          query = query.where(whereClause) as typeof query;
        }

        query = query.orderBy(orderBy) as typeof query;

        if (filters.limit) {
          query = query.limit(filters.limit) as typeof query;
        }

        if (filters.offset) {
          query = query.offset(filters.offset) as typeof query;
        }

        return await query;
      },
      'findAll',
      { filters }
    );
  }

  /**
   * Get next item number
   */
  async getNextItemNumber(tx?: Tx): Promise<number> {
    const database = tx ?? db;
    const result = await database.select({ maxNumber: max(cards.itemNumber) }).from(cards);
    return (result[0]?.maxNumber ?? 0) + 1;
  }

  /**
   * Helper to sanitize card data
   * Converts empty strings to null for numeric/date fields
   */
  private sanitizeCardData(data: Partial<Card> | CreateCardData): Partial<Card> {
    const cleanData: any = { ...data };
    const numericFields = [
      'grade',
      'year',
      'purchasePrice',
      'currentValue',
      'estimatedValue',
      'soldPrice',
    ];
    const dateFields = ['purchaseDate', 'soldDate', 'valuationDate'];

    // Sanitize numeric fields
    numericFields.forEach(field => {
      if (cleanData[field] === '') {
        cleanData[field] = null;
      } else if (typeof cleanData[field] === 'string' && !isNaN(Number(cleanData[field]))) {
        // Drizzle numeric types are often strings in JS, but ensure valid number string
        // cleanData[field] = cleanData[field];
      }
    });

    // Sanitize date fields
    dateFields.forEach(field => {
      if (cleanData[field] === '') {
        cleanData[field] = null;
      }
    });

    return cleanData;
  }

  /**
   * Create a new card
   */
  async create(data: Partial<Card>, tx?: Tx): Promise<Card> {
    const database = tx ?? db;

    return this.executeQuery(
      async () => {
        // Sanitize data before use
        const sanitizedData = this.sanitizeCardData(data);

        // Omit itemNumber to let database generate it via serial/sequence
        const insertData = {
          ...sanitizedData,
          gradingCompany: data.gradingCompany || 'UNGRADED',
          status: data.status || 'COLLECTION',
          // Explicitly set grade to null if it strictly equals empty string or undefined/null after sanitization
          grade: sanitizedData.grade ?? null,
          isAutographed: data.isAutographed ?? false,
          hasMemorabilia: data.hasMemorabilia ?? false,
          attachmentImages: data.attachmentImages || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await database
          .insert(cards)
          .values(insertData as NewCard)
          .returning();

        dbLogger.info('Card created', { id: result[0].id, itemNumber: result[0].itemNumber });
        return result[0];
      },
      'create',
      { playerName: data.playerName }
    );
  }

  /**
   * Update a card
   */
  async update(id: string, data: Partial<Card>, tx?: Tx): Promise<Card | null> {
    const database = tx ?? db;

    return this.executeQuery(
      async () => {
        // Sanitize data before use
        const updateData = {
          ...this.sanitizeCardData(data),
          updatedAt: new Date(),
        };

        const result = await database
          .update(cards)
          .set(updateData)
          .where(eq(cards.id, id))
          .returning();

        if (result.length === 0) {
          dbLogger.warn('Card not found for update', { id });
          return null;
        }

        dbLogger.info('Card updated', { id });
        return result[0];
      },
      'update',
      { id }
    );
  }

  /**
   * Update card status
   */
  async updateStatus(
    id: string,
    status: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY',
    soldInfo?: { soldPrice?: string; soldDate?: string },
    tx?: Tx
  ): Promise<Card | null> {
    const database = tx ?? db;

    return this.executeQuery(
      async () => {
        const updateData: Partial<Card> = {
          status,
          updatedAt: new Date(),
        };

        // If marking as SOLD, set sold info
        if (status === 'SOLD' && soldInfo) {
          updateData.soldPrice = soldInfo.soldPrice ?? null;
          updateData.soldDate = soldInfo.soldDate ?? null;
        }

        const result = await database
          .update(cards)
          .set(updateData)
          .where(eq(cards.id, id))
          .returning();

        return result[0] || null;
      },
      'updateStatus',
      { id, status }
    );
  }

  /**
   * Delete a card
   */
  async delete(id: string, tx?: Tx): Promise<boolean> {
    const database = tx ?? db;

    return this.executeQuery(
      async () => {
        const result = await database
          .delete(cards)
          .where(eq(cards.id, id))
          .returning({ id: cards.id });

        if (result.length === 0) {
          dbLogger.warn('Card not found for delete', { id });
          return false;
        }

        dbLogger.info('Card deleted', { id });
        return true;
      },
      'delete',
      { id }
    );
  }

  /**
   * Count cards with filters
   */
  async count(filters: CardFilters = {}, tx?: Tx): Promise<number> {
    const database = tx ?? db;
    const whereClause = this.buildWhereClause(filters);

    return this.executeQuery(
      async () => {
        let query = database.select({ count: count() }).from(cards);

        if (whereClause) {
          query = query.where(whereClause) as typeof query;
        }

        const result = await query;
        return result[0]?.count ?? 0;
      },
      'count',
      { filters }
    );
  }

  /**
   * Get card statistics
   */
  async getStats(tx?: Tx): Promise<{
    totalCards: number;
    totalValue: number;
    totalCost: number;
    avgGrade: number | null;
  }> {
    const database = tx ?? db;

    return this.executeQuery(
      async () => {
        const result = await database
          .select({
            totalCards: sql<number>`count(*)`,
            totalValue: sql<number>`COALESCE(SUM(CAST(current_value AS DECIMAL)), 0)`,
            totalCost: sql<number>`COALESCE(SUM(CAST(purchase_price AS DECIMAL)), 0)`,
            avgGrade: sql<number>`AVG(CAST(grade AS DECIMAL))`,
          })
          .from(cards)
          .where(sql`${cards.status} != 'SOLD'`);

        return {
          totalCards: Number(result[0]?.totalCards || 0),
          totalValue: Number(result[0]?.totalValue || 0),
          totalCost: Number(result[0]?.totalCost || 0),
          avgGrade: result[0]?.avgGrade ? Number(result[0].avgGrade) : null,
        };
      },
      'getStats',
      {}
    );
  }
}

export const cardRepository = new CardRepository();
