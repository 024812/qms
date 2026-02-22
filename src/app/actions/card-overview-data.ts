'use server';

import { db } from '@/db';
import { cards } from '@/db/schema';

export interface MonthlyBuySellData {
  month: string;
  bought: number;
  sold: number;
}

export interface ActivityItem {
  id: string;
  type: 'added' | 'sold';
  playerName: string;
  date: string;
  amount: number;
  brand: string;
  year: number;
}

/**
 * Get monthly buy/sell aggregation for the last 12 months
 */
export async function getMonthlyBuySellData(): Promise<MonthlyBuySellData[]> {
  const allCards = await db.select().from(cards);

  const now = new Date();
  const months: MonthlyBuySellData[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearNum = date.getFullYear();
    const monthNum = date.getMonth(); // 0-indexed

    const monthLabel = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}`;

    let bought = 0;
    let sold = 0;

    for (const card of allCards) {
      // Check purchases in this month
      if (card.purchaseDate) {
        const pDate = new Date(card.purchaseDate);
        if (pDate.getFullYear() === yearNum && pDate.getMonth() === monthNum) {
          bought += Number(card.purchasePrice) || 0;
        }
      }

      // Check sales in this month
      if (card.soldDate && card.status === 'SOLD') {
        const sDate = new Date(card.soldDate);
        if (sDate.getFullYear() === yearNum && sDate.getMonth() === monthNum) {
          sold += Number(card.soldPrice) || 0;
        }
      }
    }

    months.push({
      month: monthLabel,
      bought: Math.round(bought * 100) / 100,
      sold: Math.round(sold * 100) / 100,
    });
  }

  return months;
}

/**
 * Get recent activity (recently added and sold cards)
 */
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const allCards = await db.select().from(cards);

  const activities: ActivityItem[] = [];

  for (const card of allCards) {
    // Added activity - use createdAt
    if (card.createdAt) {
      activities.push({
        id: `add-${card.id}`,
        type: 'added',
        playerName: card.playerName,
        date: card.createdAt.toISOString(),
        amount: Number(card.purchasePrice) || 0,
        brand: card.brand,
        year: card.year,
      });
    }

    // Sold activity
    if (card.status === 'SOLD' && card.soldDate) {
      activities.push({
        id: `sold-${card.id}`,
        type: 'sold',
        playerName: card.playerName,
        date: new Date(card.soldDate).toISOString(),
        amount: Number(card.soldPrice) || 0,
        brand: card.brand,
        year: card.year,
      });
    }
  }

  // Sort by date descending
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return activities.slice(0, limit);
}
