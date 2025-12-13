import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payouts, wallets, pointsLog } from '@akorfa/shared';
import { eq, desc, sql } from 'drizzle-orm';

const POINTS_TO_USD = 0.001;
const MIN_PAYOUT_POINTS = 1000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({
        payouts: [],
        stats: {
          availablePoints: 0,
          cashValue: '0.00',
          canWithdraw: false,
          minPayout: MIN_PAYOUT_POINTS,
          minPayoutValue: (MIN_PAYOUT_POINTS * POINTS_TO_USD).toFixed(2),
          totalWithdrawn: '0.00',
          canMonetize: false,
          creatorLevel: 1
        }
      });
    }

    const userPayouts = await db.select()
      .from(payouts)
      .where(eq(payouts.userId, userId))
      .orderBy(desc(payouts.createdAt));

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    const availablePoints = wallet?.pointsBalance || 0;
    const cashValue = availablePoints * POINTS_TO_USD;
    const canWithdraw = availablePoints >= MIN_PAYOUT_POINTS && wallet?.canMonetize;

    return NextResponse.json({
      payouts: userPayouts,
      stats: {
        availablePoints,
        cashValue: cashValue.toFixed(2),
        canWithdraw,
        minPayout: MIN_PAYOUT_POINTS,
        minPayoutValue: (MIN_PAYOUT_POINTS * POINTS_TO_USD).toFixed(2),
        totalWithdrawn: wallet?.totalWithdrawn || '0.00',
        canMonetize: wallet?.canMonetize || false,
        creatorLevel: wallet?.creatorLevel || 1
      }
    });
  } catch (error) {
    console.error('Payouts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, pointsToConvert, paymentMethod } = body;

    if (!userId || !pointsToConvert) {
      return NextResponse.json({ error: 'userId and pointsToConvert required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid UUID userId required for payout requests' }, { status: 400 });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (!wallet.canMonetize) {
      return NextResponse.json({ 
        error: 'Not eligible for monetization. Reach 500 followers to unlock.' 
      }, { status: 400 });
    }

    if ((wallet.pointsBalance || 0) < pointsToConvert) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    }

    if (pointsToConvert < MIN_PAYOUT_POINTS) {
      return NextResponse.json({ 
        error: `Minimum payout is ${MIN_PAYOUT_POINTS} points ($${(MIN_PAYOUT_POINTS * POINTS_TO_USD).toFixed(2)})` 
      }, { status: 400 });
    }

    const amount = (pointsToConvert * POINTS_TO_USD).toFixed(2);

    const [payout] = await db.insert(payouts).values({
      userId,
      amount,
      pointsConverted: pointsToConvert,
      paymentMethod: paymentMethod || 'pending',
      status: 'pending'
    }).returning();

    await db.update(wallets)
      .set({
        pointsBalance: sql`${wallets.pointsBalance} - ${pointsToConvert}`,
        totalWithdrawn: sql`${wallets.totalWithdrawn} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));

    await db.insert(pointsLog).values({
      userId,
      amount: -pointsToConvert,
      action: 'payout_request',
      description: `Payout request for $${amount}`,
      referenceId: payout.id,
      referenceType: 'payout'
    });

    return NextResponse.json({ 
      success: true, 
      payout,
      message: `Payout request for $${amount} submitted. Will be processed within 3-5 business days.`
    });
  } catch (error) {
    console.error('Payout request error:', error);
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
  }
}
