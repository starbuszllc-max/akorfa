import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gifts, wallets, pointsLog } from '@akorfa/shared';
import { eq, desc, sql, or } from 'drizzle-orm';

const GIFT_TYPES = {
  star: { name: 'Star', coins: 10 },
  heart: { name: 'Heart', coins: 20 },
  diamond: { name: 'Diamond', coins: 50 },
  crown: { name: 'Crown', coins: 100 },
  rocket: { name: 'Rocket', coins: 200 },
  trophy: { name: 'Trophy', coins: 500 }
};

const CREATOR_CUT = 0.5;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (type === 'types') {
      return NextResponse.json({ giftTypes: GIFT_TYPES });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({
        gifts: [],
        stats: { received: 0, sent: 0, totalCoinsReceived: 0, totalCoinsSent: 0, earnings: 0 }
      });
    }

    const userGifts = await db.select()
      .from(gifts)
      .where(or(eq(gifts.senderId, userId), eq(gifts.receiverId, userId)))
      .orderBy(desc(gifts.createdAt))
      .limit(100);

    const received = userGifts.filter((g: any) => g.receiverId === userId);
    const sent = userGifts.filter((g: any) => g.senderId === userId);

    const totalReceived = received.reduce((sum: number, g: any) => sum + (g.coinAmount || 0), 0);
    const totalSent = sent.reduce((sum: number, g: any) => sum + (g.coinAmount || 0), 0);

    return NextResponse.json({
      gifts: userGifts,
      stats: {
        received: received.length,
        sent: sent.length,
        totalCoinsReceived: totalReceived,
        totalCoinsSent: totalSent,
        earnings: Math.floor(totalReceived * CREATOR_CUT)
      }
    });
  } catch (error) {
    console.error('Gifts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch gifts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, receiverId, postId, giftType, message } = body;

    if (!senderId || !receiverId || !giftType) {
      return NextResponse.json({ error: 'senderId, receiverId, giftType required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(senderId) || !UUID_REGEX.test(receiverId)) {
      return NextResponse.json({ error: 'Valid UUID required for senderId and receiverId' }, { status: 400 });
    }

    const giftInfo = GIFT_TYPES[giftType as keyof typeof GIFT_TYPES];
    if (!giftInfo) {
      return NextResponse.json({ error: 'Invalid gift type' }, { status: 400 });
    }

    const [senderWallet] = await db.select().from(wallets).where(eq(wallets.userId, senderId));
    
    if (!senderWallet || (senderWallet.coinsBalance || 0) < giftInfo.coins) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    await db.update(wallets)
      .set({
        coinsBalance: sql`${wallets.coinsBalance} - ${giftInfo.coins}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, senderId));

    const creatorEarnings = Math.floor(giftInfo.coins * CREATOR_CUT);
    const pointsEquivalent = creatorEarnings * 10;

    const [receiverWallet] = await db.select().from(wallets).where(eq(wallets.userId, receiverId));

    if (receiverWallet) {
      await db.update(wallets)
        .set({
          coinsBalance: sql`${wallets.coinsBalance} + ${creatorEarnings}`,
          totalEarned: sql`${wallets.totalEarned} + ${pointsEquivalent}`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, receiverId));
    } else {
      await db.insert(wallets).values({
        userId: receiverId,
        coinsBalance: creatorEarnings,
        totalEarned: pointsEquivalent,
        pointsBalance: 0,
        creatorLevel: 1
      });
    }

    const [gift] = await db.insert(gifts).values({
      senderId,
      receiverId,
      postId,
      giftType,
      coinAmount: giftInfo.coins,
      message
    }).returning();

    await db.insert(pointsLog).values({
      userId: receiverId,
      amount: pointsEquivalent,
      action: 'gift_received',
      description: `Received ${giftInfo.name} gift`,
      referenceId: gift.id,
      referenceType: 'gift'
    });

    return NextResponse.json({ success: true, gift });
  } catch (error) {
    console.error('Gift send error:', error);
    return NextResponse.json({ error: 'Failed to send gift' }, { status: 500 });
  }
}
