/**
 * Cards API Route
 * 
 * Handles CRUD operations for sports cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { cards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userCards = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, session.user.id))
      .orderBy(cards.createdAt);

    return NextResponse.json({ cards: userCards });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const newCard = await db
      .insert(cards)
      .values({
        userId: session.user.id, // text type, not uuid
        playerName: body.playerName,
        sport: body.sport,
        team: body.team || null,
        position: body.position || null,
        year: body.year,
        brand: body.brand,
        series: body.series || null,
        cardNumber: body.cardNumber || null,
        gradingCompany: body.gradingCompany || 'UNGRADED',
        grade: body.grade ? body.grade.toString() : null,
        certificationNumber: body.certificationNumber || null,
        purchasePrice: body.purchasePrice ? body.purchasePrice.toString() : null,
        purchaseDate: body.purchaseDate || null,
        currentValue: body.currentValue ? body.currentValue.toString() : null,
        estimatedValue: body.estimatedValue ? body.estimatedValue.toString() : null,
        parallel: body.parallel || null,
        serialNumber: body.serialNumber || null,
        isAutographed: body.isAutographed || false,
        hasMemorabilia: body.hasMemorabilia || false,
        memorabiliaType: body.memorabiliaType || null,
        status: body.status || 'COLLECTION',
        location: body.location || null,
        storageType: body.storageType || null,
        condition: body.condition || null,
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json({ card: newCard[0] });
  } catch (error) {
    console.error('Failed to create card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
