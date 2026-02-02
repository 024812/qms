'use server';

/**
 * Card Server Actions
 *
 * Server-side actions for card CRUD operations with proper Zod validation.
 */

import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq, and, ilike, desc, sql, type SQL } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ========== Input Schemas ==========

const cardInputSchema = z.object({
  id: z.string().optional(),
  playerName: z.string().min(1, 'Player name is required'),
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']),
  team: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  year: z.coerce.number().int().min(1900).max(2100),
  brand: z.string().min(1, 'Brand is required'),
  series: z.string().optional().nullable(),
  cardNumber: z.string().optional().nullable(),
  gradingCompany: z.enum(['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC']).optional().nullable(),
  grade: z.coerce.number().min(0).max(10).optional().nullable(),
  certificationNumber: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  currentValue: z.coerce.number().min(0).optional().nullable(),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  soldPrice: z.coerce.number().min(0).optional().nullable(),
  soldDate: z.string().optional().nullable(),
  isAutographed: z.boolean().optional().nullable(),
  hasMemorabilia: z.boolean().optional().nullable(),
  memorabiliaType: z.string().optional().nullable(),
  parallel: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).optional().nullable(),
  location: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  mainImage: z.string().optional().nullable(),
  frontImage: z.string().optional().nullable(),
  backImage: z.string().optional().nullable(),
  attachmentImages: z.array(z.string()).optional().nullable(),
});

const filterSchema = z.object({
  sport: z.enum(['BASKETBALL', 'SOCCER', 'OTHER']).optional(),
  gradingCompany: z.enum(['UNGRADED', 'PSA', 'BGS', 'SGC', 'CGC']).optional(),
  status: z.enum(['COLLECTION', 'FOR_SALE', 'SOLD', 'GRADING', 'DISPLAY']).optional(),
});

type FilterInput = z.infer<typeof filterSchema>;

// ========== Helper Functions ==========

/** Clean and convert values for numeric fields - returns string for numeric DB columns */
function cleanNumericToString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num === 'number' && !isNaN(num)) {
    return String(num);
  }
  return null;
}

// ========== Actions ==========

/**
 * Get cards with filtering and pagination
 */
export async function getCards({
  search,
  filter,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  filter?: FilterInput;
  page?: number;
  pageSize?: number;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const conditions: SQL[] = [eq(cards.userId, session.user.id)];

  if (search) {
    conditions.push(ilike(cards.playerName, `%${search}%`));
  }

  if (filter) {
    const validatedFilter = filterSchema.safeParse(filter);
    if (validatedFilter.success) {
      const f = validatedFilter.data;
      if (f.sport) conditions.push(eq(cards.sport, f.sport));
      if (f.gradingCompany) conditions.push(eq(cards.gradingCompany, f.gradingCompany));
      if (f.status) conditions.push(eq(cards.status, f.status));
    }
  }

  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(cards)
      .where(and(...conditions))
      .orderBy(desc(cards.itemNumber))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(cards)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count || 0);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single card by ID
 */
export async function getCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (!id || typeof id !== 'string') {
    throw new Error('Invalid card ID');
  }

  const result = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, id), eq(cards.userId, session.user.id)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create or update a card with proper validation
 */
export async function saveCard(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Validate input with Zod
  const validated = cardInputSchema.safeParse(data);
  if (!validated.success) {
    console.error('Validation errors:', validated.error.flatten());
    const firstError = validated.error.issues[0];
    throw new Error(`Invalid card data: ${firstError?.message || 'Validation failed'}`);
  }

  const input = validated.data;

  // Prepare clean data for database - convert numbers to strings for numeric columns
  const cleanData = {
    userId: session.user.id,
    playerName: input.playerName,
    sport: input.sport,
    team: input.team || null,
    position: input.position || null,
    year: input.year,
    brand: input.brand,
    series: input.series || null,
    cardNumber: input.cardNumber || null,
    gradingCompany: input.gradingCompany || 'UNGRADED',
    grade: cleanNumericToString(input.grade),
    certificationNumber: input.certificationNumber || null,
    purchasePrice: cleanNumericToString(input.purchasePrice),
    purchaseDate: input.purchaseDate || null,
    currentValue: cleanNumericToString(input.currentValue),
    estimatedValue: cleanNumericToString(input.estimatedValue),
    soldPrice: cleanNumericToString(input.soldPrice),
    soldDate: input.soldDate || null,
    isAutographed: input.isAutographed || false,
    hasMemorabilia: input.hasMemorabilia || false,
    memorabiliaType: input.memorabiliaType || null,
    parallel: input.parallel || null,
    serialNumber: input.serialNumber || null,
    status: input.status || 'COLLECTION',
    location: input.location || null,
    condition: input.condition || null,
    notes: input.notes || null,
    mainImage: input.mainImage || input.frontImage || null,
    attachmentImages: input.attachmentImages || (input.backImage ? [input.backImage] : null),
    updatedAt: new Date(),
  };

  if (input.id) {
    // Update existing card
    await db
      .update(cards)
      .set(cleanData)
      .where(and(eq(cards.id, input.id), eq(cards.userId, session.user.id)));
  } else {
    // Create new card - get next item number
    const maxResult = await db
      .select({ max: sql<number>`COALESCE(MAX(item_number), 0)` })
      .from(cards)
      .where(eq(cards.userId, session.user.id));

    const nextItemNumber = (maxResult[0]?.max || 0) + 1;

    await db.insert(cards).values({
      ...cleanData,
      itemNumber: nextItemNumber,
      createdAt: new Date(),
    });
  }

  revalidatePath('/cards');
  return { success: true };
}

/**
 * Delete a card by ID
 */
export async function deleteCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (!id || typeof id !== 'string') {
    throw new Error('Invalid card ID');
  }

  await db.delete(cards).where(and(eq(cards.id, id), eq(cards.userId, session.user.id)));

  revalidatePath('/cards');
  return { success: true };
}
