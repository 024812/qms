
import { db, Tx } from '@/db';
import { quilts, usageRecords, maintenanceRecords } from '@/db/schema';
import { dbLogger } from '@/lib/logger';
import { BaseRepositoryImpl } from './base.repository';
import {
  Quilt,
  QuiltRow,
  rowToQuilt,
  quiltToRow,
  rowToUsageRecord,
  UsageRecordRow,
} from '@/lib/database/types';
import { QuiltStatus, Season, UsageType } from '@/lib/validations/quilt';
import { updateTag } from 'next/cache';
import { eq, and, or, ilike, count, max, desc, asc, isNull, sql, SQL } from 'drizzle-orm';

// Valid sort fields that map to database columns
export type QuiltSortField =
  | 'itemNumber'
  | 'name'
  | 'season'
  | 'weightGrams'
  | 'createdAt'
  | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface QuiltFilters {
  season?: Season;
  status?: QuiltStatus;
  location?: string;
  brand?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: QuiltSortField;
  sortOrder?: SortOrder;
}

export interface CreateQuiltData {
  name?: string;
  season: Season;
  lengthCm: number;
  widthCm: number;
  weightGrams: number;
  fillMaterial: string;
  materialDetails?: string | null;
  color: string;
  brand?: string | null;
  purchaseDate?: Date | null;
  location: string;
  packagingInfo?: string | null;
  currentStatus?: QuiltStatus;
  notes?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  mainImage?: string | null;
  attachmentImages?: string[] | null;
}



export class QuiltRepository extends BaseRepositoryImpl<QuiltRow, Quilt> {
  protected tableName = 'quilts';

  /**
   * Note on rowToModel/modelToRow in this refactor:
   * Drizzle returns data in camelCase (matching Quilt interface) because of schema definition.
   * However, to maintain compatibility with BaseRepository which might expect specific transformations,
   * or if we ever need to map back to snake_case for some reason, we keep these.
   * But in the Drizzle implementation below, we largely get the model directly.
   * We will cast Drizzle result to QuiltRow to satisfy the generic if needed or just cast to Quilt.
   */
  protected rowToModel(row: QuiltRow): Quilt {
    return rowToQuilt(row);
  }

  protected modelToRow(model: Partial<Quilt>): Partial<QuiltRow> {
    return quiltToRow(model);
  }

  /**
   * Helper to build WHERE clause for filters
   */
  private buildWhereClause(filters: QuiltFilters) {
    const conditions: SQL[] = [];
    const { season, status, location, brand, search } = filters;

    if (season) {
      conditions.push(eq(quilts.season, season));
    }
    if (status) {
      conditions.push(eq(quilts.currentStatus, status));
    }
    if (location) {
      conditions.push(ilike(quilts.location, `%${location}%`));
    }
    if (brand) {
      conditions.push(ilike(quilts.brand, `%${brand}%`));
    }
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(quilts.name, searchPattern),
          ilike(quilts.color, searchPattern),
          ilike(quilts.fillMaterial, searchPattern),
          ilike(quilts.notes, searchPattern)
        )!
      );
    }
    
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Find a quilt by ID
   */
  async findById(id: string, tx?: Tx): Promise<Quilt | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const rows = await d.select().from(quilts).where(eq(quilts.id, id)).limit(1);
        if (rows.length === 0) return null;
        // Drizzle returns camelCase matching schema definition.
        // Assuming implementation matches Quilt interface.
        // We cast to UnknownCrude -> Quilt because schema matches model.
        return rows[0] as unknown as Quilt; 
      },
      'findById',
      { id }
    );
  }

  /**
   * Find all quilts with filters
   */
  async findAll(filters: QuiltFilters = {}, tx?: Tx): Promise<Quilt[]> {
    return this.executeQuery(
      async () => {
        const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const d = tx || db;

        const where = this.buildWhereClause(filters);

        // Sorting
        let orderBy: SQL;
        const direction = sortOrder === 'asc' ? asc : desc;
        
        switch (sortBy) {
          case 'itemNumber': orderBy = direction(quilts.itemNumber); break;
          case 'name': orderBy = direction(quilts.name); break;
          case 'season': orderBy = direction(quilts.season); break;
          case 'weightGrams': orderBy = direction(quilts.weightGrams); break;
          case 'updatedAt': orderBy = direction(quilts.updatedAt); break;
          case 'createdAt': 
          default:
            orderBy = direction(quilts.createdAt);
        }

        const rows = await d.select()
          .from(quilts)
          .where(where)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);

        return rows as unknown as Quilt[];
      },
      'findAll',
      { filters }
    );
  }

  async findByStatus(status: QuiltStatus, tx?: Tx): Promise<Quilt[]> {
    return this.findAll({ status, limit: 1000 }, tx); // Use findAll logic
  }

  async findBySeason(season: Season, tx?: Tx): Promise<Quilt[]> {
    return this.findAll({ season, limit: 1000 }, tx); // Use findAll logic
  }

  async getNextItemNumber(tx?: Tx): Promise<number> {
    return this.executeQuery(async () => {
      const d = tx || db;
      const result = await d.select({ maxNum: max(quilts.itemNumber) }).from(quilts);
      return (result[0]?.maxNum || 0) + 1;
    }, 'getNextItemNumber');
  }

  generateQuiltName(data: CreateQuiltData): string {
    const brand = data.brand || '未知品牌';
    const color = data.color || '未知颜色';
    const weight = data.weightGrams || 0;

    const seasonMap: Record<Season, string> = {
      WINTER: '冬',
      SPRING_AUTUMN: '春秋',
      SUMMER: '夏',
    };
    const season = seasonMap[data.season] || '通用';

    return `${brand}${color}${weight}克${season}被`;
  }

  async create(data: CreateQuiltData, tx?: Tx): Promise<Quilt> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const itemNumber = await this.getNextItemNumber(d);
        const name = data.name || this.generateQuiltName(data);
        const now = new Date();

        const newQuiltValues = {
          // id is auto-generated by default in schema usually, but repo used crypto.randomUUID
          // If schema has defaultRandom, we can skip. But user schema uses uuid primaryKey. 
          // Assuming Drizzle handles default if explicit not provided, or we provide it.
          // Repo provided it manually. Let's do same or let DB handle if schema says defaultRandom().
          // Schema def: id: uuid("id").primaryKey().defaultRandom()
          // So we can skip ID.
          itemNumber,
          name,
          season: data.season,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          weightGrams: data.weightGrams,
          fillMaterial: data.fillMaterial,
          materialDetails: data.materialDetails,
          color: data.color,
          brand: data.brand,
          purchaseDate: data.purchaseDate ?? null,
          location: data.location,
          packagingInfo: data.packagingInfo,
          currentStatus: data.currentStatus || 'STORAGE',
          notes: data.notes,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.thumbnailUrl,
          mainImage: data.mainImage,
          attachmentImages: data.attachmentImages,
          createdAt: now,
          updatedAt: now,
        };

        dbLogger.info('Creating quilt', { itemNumber, name });

        const rows = await d.insert(quilts).values(newQuiltValues).returning();
        const quilt = rows[0] as unknown as Quilt;

        // Invalidate cache tags
        updateTag('quilts');
        updateTag('quilts-list');
        updateTag(`quilts-status-${quilt.currentStatus}`);
        updateTag(`quilts-season-${quilt.season}`);

        return quilt;
      },
      'create',
      { data }
    );
  }

  async update(id: string, data: Partial<CreateQuiltData>, tx?: Tx): Promise<Quilt | null> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        // Check existence
        const current = await this.findById(id, d);
        if (!current) {
          dbLogger.warn('Quilt not found for update', { id });
          return null;
        }

        const now = new Date();
        
        // Map partial data
        const updateValues: any = { updatedAt: now };
        // We only set fields that are defined in data
        // ... simplistic mapping
        if (data.name !== undefined) updateValues.name = data.name;
        if (data.season !== undefined) updateValues.season = data.season;
        if (data.lengthCm !== undefined) updateValues.lengthCm = data.lengthCm;
        if (data.widthCm !== undefined) updateValues.widthCm = data.widthCm;
        if (data.weightGrams !== undefined) updateValues.weightGrams = data.weightGrams;
        if (data.fillMaterial !== undefined) updateValues.fillMaterial = data.fillMaterial;
        if (data.materialDetails !== undefined) updateValues.materialDetails = data.materialDetails;
        if (data.color !== undefined) updateValues.color = data.color;
        if (data.brand !== undefined) updateValues.brand = data.brand;
        if (data.purchaseDate !== undefined) updateValues.purchaseDate = data.purchaseDate ?? null;
        if (data.location !== undefined) updateValues.location = data.location;
        if (data.packagingInfo !== undefined) updateValues.packagingInfo = data.packagingInfo;
        if (data.currentStatus !== undefined) updateValues.currentStatus = data.currentStatus;
        if (data.notes !== undefined) updateValues.notes = data.notes;
        if (data.imageUrl !== undefined) updateValues.imageUrl = data.imageUrl;
        if (data.thumbnailUrl !== undefined) updateValues.thumbnailUrl = data.thumbnailUrl;
        if (data.mainImage !== undefined) updateValues.mainImage = data.mainImage;
        if (data.attachmentImages !== undefined) updateValues.attachmentImages = data.attachmentImages;

        const rows = await d.update(quilts)
          .set(updateValues)
          .where(eq(quilts.id, id))
          .returning();
        
        if (rows.length === 0) return null;
        const updated = rows[0] as unknown as Quilt;

        // Invalidate tags
        updateTag('quilts');
        updateTag('quilts-list');
        updateTag(`quilts-${id}`);
        if (current.currentStatus !== updated.currentStatus) {
            updateTag(`quilts-status-${current.currentStatus}`);
            updateTag(`quilts-status-${updated.currentStatus}`);
        }
        if (current.season !== updated.season) {
            updateTag(`quilts-season-${current.season}`);
            updateTag(`quilts-season-${updated.season}`);
        }

        return updated;
      },
      'update',
      { id, data }
    );
  }

  async updateStatus(id: string, status: QuiltStatus, tx?: Tx): Promise<Quilt | null> {
    return this.update(id, { currentStatus: status }, tx);
  }

  async updateStatusWithUsageRecord(
    id: string,
    newStatus: QuiltStatus,
    usageType: UsageType = 'REGULAR',
    notes?: string
  ): Promise<{
    quilt: Quilt;
    usageRecord?: { id: string; quiltId: string; startDate: Date; endDate: Date | null };
  }> {
    return this.executeQuery(
      async () => {
        // Use proper Drizzle transaction
        return await db.transaction(async (tx) => {
           const current = await this.findById(id, tx);
           if (!current) throw new Error('Quilt not found');
           
           const previousStatus = current.currentStatus;
           if (previousStatus === newStatus) {
             return { quilt: current };
           }

           let usageRecord: { id: string; quiltId: string; startDate: Date; endDate: Date | null } | undefined;
           const now = new Date();

           // FROM IN_USE -> End active usage record
           if (previousStatus === 'IN_USE' && newStatus !== 'IN_USE') {
             const endedHelperRows = await tx.update(usageRecords)
                .set({ endDate: now, updatedAt: now })
                .where(and(eq(usageRecords.quiltId, id), isNull(usageRecords.endDate)))
                .returning();
             
              if (endedHelperRows.length > 0) {
                 const r = endedHelperRows[0];
                 // Map to required shape
                 usageRecord = {
                    id: r.id,
                    quiltId: r.quiltId,
                    startDate: new Date(r.startDate), // Ensure Date
                    endDate: r.endDate ? new Date(r.endDate) : null
                 };
              }
           }

           // TO IN_USE -> Start new usage record
           if (newStatus === 'IN_USE' && previousStatus !== 'IN_USE') {
              // Verify no active
              const activeCount = await tx.select({ count: count() })
                  .from(usageRecords)
                  .where(and(eq(usageRecords.quiltId, id), isNull(usageRecords.endDate)));
              
              if (activeCount[0].count > 0) {
                  throw new Error('Quilt already has an active usage record');
              }

              // Create
              const newRecRows = await tx.insert(usageRecords).values({
                 quiltId: id,
                 usageType: usageType,
                 notes: notes,
                 startDate: now,
                 endDate: null, 
              }).returning();

              if (newRecRows.length > 0) {
                 const r = newRecRows[0];
                 usageRecord = {
                    id: r.id,
                    quiltId: r.quiltId,
                    startDate: new Date(r.startDate),
                    endDate: null
                 };
              }
           }

           // Update Quilt Status
           const updated = await this.update(id, { currentStatus: newStatus }, tx);
           if (!updated) throw new Error('Failed to update quilt status');

           return { quilt: updated, usageRecord };
        });
      },
      'updateStatusWithUsageRecord',
      { id, newStatus, usageType }
    );
  }

  async getActiveUsageRecordCount(quiltId: string, tx?: Tx): Promise<number> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const result = await d.select({ count: count() })
            .from(usageRecords)
            .where(and(eq(usageRecords.quiltId, quiltId), isNull(usageRecords.endDate)));
        return result[0].count;
      },
      'getActiveUsageRecordCount',
      { quiltId }
    );
  }

  async delete(id: string, tx?: Tx): Promise<boolean> {
     return this.executeQuery(
        async () => {
           // We might want to use a transaction for delete multiple tables
           const operation = async (t: Tx) => {
               // Get for cache
               const quilt = await this.findById(id, t);
               
               // Delete related
               await t.delete(usageRecords).where(eq(usageRecords.quiltId, id));
               await t.delete(maintenanceRecords).where(eq(maintenanceRecords.quiltId, id));
               
               // Delete quilt
               const res = await t.delete(quilts).where(eq(quilts.id, id)).returning({ id: quilts.id });
               
               const success = res.length > 0;
               if (success) {
                   updateTag('quilts');
                   updateTag('quilts-list');
                   updateTag(`quilts-${id}`);
                   if (quilt) {
                       updateTag(`quilts-status-${quilt.currentStatus}`);
                       updateTag(`quilts-season-${quilt.season}`);
                   }
               }
               return success;
           };

           if (tx) return operation(tx);
           return await db.transaction(operation);
        },
        'delete',
        { id }
     );
  }

  async count(filters: QuiltFilters = {}, tx?: Tx): Promise<number> {
    return this.executeQuery(
      async () => {
        const d = tx || db;
        const where = this.buildWhereClause(filters);
        const result = await d.select({ count: count() }).from(quilts).where(where);
        return result[0].count;
      },
      'count',
      { filters }
    );
  }
}

export const quiltRepository = new QuiltRepository();
