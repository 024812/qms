'use server';

import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq, desc, ilike, or, and, count, type SQL } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export type CardFilter = {
  search?: string;
  sport?: string;
  gradingCompany?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export async function getCards(filter?: CardFilter) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const page = filter?.page || 1;
  const limit = filter?.limit || 12; // Grid view default 12 (3x4 or 4x3)
  const offset = (page - 1) * limit;

  const search = filter?.search?.trim();
  const conditions = [eq(cards.userId, session.user.id)];

  if (search) {
    conditions.push(
      or(
        ilike(cards.playerName, `%${search}%`) as SQL<unknown>,
        ilike(cards.brand, `%${search}%`) as SQL<unknown>,
        ilike(cards.series, `%${search}%`) as SQL<unknown>,
        ilike(cards.team, `%${search}%`) as SQL<unknown>
      ) as SQL<unknown>
    );
  }

  if (filter?.sport && filter.sport !== 'ALL') {
    conditions.push(eq(cards.sport, filter.sport as any));
  }

  if (filter?.gradingCompany && filter.gradingCompany !== 'ALL') {
    conditions.push(eq(cards.gradingCompany, filter.gradingCompany as any));
  }

  if (filter?.status && filter.status !== 'ALL') {
    conditions.push(eq(cards.status, filter.status as any));
  }

  const totalResult = await db
    .select({ count: count() })
    .from(cards)
    .where(and(...conditions));

  const total = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  const items = await db.query.cards.findMany({
    where: and(...conditions),
    orderBy: [desc(cards.createdAt)],
    limit: limit,
    offset: offset,
  });

  return {
    items,
    total,
    totalPages,
    page,
    limit,
  };
}

export async function getCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const card = await db.query.cards.findFirst({
    where: and(eq(cards.id, id), eq(cards.userId, session.user.id)),
  });

  return card;
}

export async function saveCard(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Remove empty strings for numeric fields to allow nullable
  const cleanData = { ...data };
  ['grade', 'year', 'purchasePrice', 'currentValue', 'estimatedValue'].forEach(key => {
    if (cleanData[key] === '') cleanData[key] = null;
    if (typeof cleanData[key] === 'string' && !isNaN(Number(cleanData[key]))) {
      cleanData[key] = Number(cleanData[key]);
    }
  });

  // Ensure userId is set
  cleanData.userId = session.user.id;

  if (cleanData.id) {
    // Update
    await db
      .update(cards)
      .set(cleanData)
      .where(and(eq(cards.id, cleanData.id), eq(cards.userId, session.user.id)));
  } else {
    // Create
    await db.insert(cards).values(cleanData);
  }

  revalidatePath('/cards');
  return { success: true };
}

export async function deleteCard(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db.delete(cards).where(and(eq(cards.id, id), eq(cards.userId, session.user.id)));
  revalidatePath('/cards');
  return { success: true };
}
