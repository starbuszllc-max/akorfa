import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wallets, pointsLog, profiles, coinTransactions } from '@akorfa/shared';
import { eq, desc, sql } from 'drizzle-orm';

const POINTS_TO_USD_RATE = 0.001;

const POINTS_CONFIG = {
  post: 5,
  like_received: 1,
  comment_received: 2,
  challenge_complete: 10,
  daily_streak: 3,
  high_assessment: 20,
  helping_others: 30,
  ai_bonus: 5
};

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
        wallet: {
          pointsBalance: 0,
          coinsBalance: 0,
          totalEarned: 0,
          cashValue: '0.00',
          canWithdraw: false,
          creatorLevel: 1,
          canMonetize: false
        },
        history: [],
        pointsConfig: POINTS_CONFIG,
        conversionRate: `${Math.round(1/POINTS_TO_USD_RATE)} AP = $1`
      });
    }

    let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (!wallet) {
      [wallet] = await db.insert(wallets).values({
        userId,
        pointsBalance: 0,
        coinsBalance: 0,
        totalEarned: 0,
        creatorLevel: 1
      }).returning();
    }

    const history = await db.select()
      .from(pointsLog)
      .where(eq(pointsLog.userId, userId))
      .orderBy(desc(pointsLog.createdAt))
      .limit(50);

    const coinHistory = await db.select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(20);

    const cashValue = (wallet.pointsBalance || 0) * POINTS_TO_USD_RATE;

    return NextResponse.json({
      wallet: {
        ...wallet,
        cashValue: cashValue.toFixed(2),
        canWithdraw: (wallet.pointsBalance || 0) >= 1000 && wallet.canMonetize
      },
      history,
      coinHistory,
      pointsConfig: POINTS_CONFIG,
      conversionRate: `${Math.round(1/POINTS_TO_USD_RATE)} AP = $1`
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, amount, description, referenceId, referenceType } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid UUID userId required for write operations' }, { status: 400 });
    }

    const pointsAmount = amount || POINTS_CONFIG[action as keyof typeof POINTS_CONFIG] || 0;

    await db.insert(pointsLog).values({
      userId,
      amount: pointsAmount,
      action,
      description: description || `Earned points for ${action}`,
      referenceId,
      referenceType
    });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));

    if (wallet) {
      await db.update(wallets)
        .set({
          pointsBalance: sql`${wallets.pointsBalance} + ${pointsAmount}`,
          totalEarned: sql`${wallets.totalEarned} + ${pointsAmount}`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, userId));
    } else {
      await db.insert(wallets).values({
        userId,
        pointsBalance: pointsAmount,
        totalEarned: pointsAmount,
        coinsBalance: 0,
        creatorLevel: 1
      });
    }

    await db.update(profiles)
      .set({
        totalXp: sql`${profiles.totalXp} + ${pointsAmount}`,
        updatedAt: new Date()
      })
      .where(eq(profiles.id, userId));

    return NextResponse.json({ success: true, pointsEarned: pointsAmount });
  } catch (error) {
    console.error('Points award error:', error);
    return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
  }
}
