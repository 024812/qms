'use server';

import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface CardStats {
  totalCards: number;
  collectionCost: number;
  totalSpend: number;
  totalSold: number;
  totalProfit: number;
}

export async function getCardStats(userId: string): Promise<CardStats> {
  const allCards = await db.select().from(cards).where(eq(cards.userId, userId));

  const stats = allCards.reduce(
    (acc, card) => {
      const purchasePrice = Number(card.purchasePrice) || 0;
      const soldPrice = Number(card.soldPrice) || 0;
      const isSold = card.status === 'SOLD';

      // Total Spend: Sum of purchase price for ALL cards
      acc.totalSpend += purchasePrice;

      // Collection Cost: Sum of purchase price for cards NOT sold
      if (!isSold) {
        acc.collectionCost += purchasePrice;
      }

      // Sold Stats
      if (isSold) {
        acc.totalSold += soldPrice;
        acc.totalProfit += soldPrice - purchasePrice;
      }

      acc.totalCards++;
      return acc;
    },
    {
      totalCards: 0,
      collectionCost: 0,
      totalSpend: 0,
      totalSold: 0,
      totalProfit: 0,
    }
  );

  return stats;
}
