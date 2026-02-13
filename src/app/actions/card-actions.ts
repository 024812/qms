'use server';

/**
 * Card Server Actions
 *
 * Server-side actions for card CRUD operations with proper Zod validation.
 * Updated: Family-shared data model (no userId isolation)
 */

import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { cardRepository, type CardFilters } from '@/lib/repositories/card.repository';

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
 * Get cards with filtering and pagination (family-shared)
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

  // Build filters for repository (no userId needed)
  const filters: CardFilters = {
    search,
    excludeSold: !filter?.status, // Default: exclude SOLD unless requested
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };

  if (filter) {
    const validatedFilter = filterSchema.safeParse(filter);
    if (validatedFilter.success) {
      const f = validatedFilter.data;
      if (f.sport) filters.sport = f.sport;
      if (f.gradingCompany) filters.gradingCompany = f.gradingCompany;
      if (f.status) {
        filters.status = f.status;
        filters.excludeSold = false;
      }
    }
  }

  const [items, total] = await Promise.all([
    cardRepository.findAll(filters),
    cardRepository.count(filters),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single card by ID (family-shared)
 */
export async function getCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (!id || typeof id !== 'string') {
    throw new Error('Invalid card ID');
  }

  return cardRepository.findById(id);
}

/**
 * Create or update a card with proper validation (family-shared)
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
  };

  if (input.id) {
    // Update existing card
    await cardRepository.update(input.id, cleanData);
  } else {
    // Create new card
    await cardRepository.create(cleanData);
  }

  // Use revalidateTag for targeted cache invalidation
  revalidateTag('cards', 'max');
  return { success: true };
}

/**
 * Delete a card by ID (family-shared)
 */
export async function deleteCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  if (!id || typeof id !== 'string') {
    throw new Error('Invalid card ID');
  }

  await cardRepository.delete(id);

  // Use revalidateTag for targeted cache invalidation
  revalidateTag('cards', 'max');
  return { success: true };
}
