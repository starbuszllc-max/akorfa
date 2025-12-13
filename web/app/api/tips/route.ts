import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wallets, gifts, coinTransactions, notifications, profiles } from '@akorfa/shared';
import { eq, sql } from 'drizzle-orm';

const GIFT_TYPES = [
  { id: 'coffee', name: 'Coffee', coins: 5, icon: '☕' },
  { id: 'heart', name: 'Heart', coins: 10, icon: '❤️' },
  { id: 'star', name: 'Star', coins: 25, icon: '⭐' },
  { id: 'gem', name: 'Gem', coins: 50, icon: '💎' },
  { id: 'crown', name: 'Crown', coins: 100, icon: '👑' },
  { id: 'rocket', name: 'Rocket', coins: 250, icon: '🚀' },
];

export async function GET() {
  return NextResponse.json({ giftTypes: GIFT_TYPES });
}

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, postId, giftType, message } = await request.json();
    
    if (!senderId || !receiverId || !giftType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (senderId === receiverId) {
      return NextResponse.json({ error: 'Cannot tip yourself' }, { status: 400 });
    }
    
    const giftInfo = GIFT_TYPES.find(g => g.id === giftType);
    if (!giftInfo) {
      return NextResponse.json({ error: 'Invalid gift type' }, { status: 400 });
    }
    
    const [senderWallet] = await db.select().from(wallets).where(eq(wallets.userId, senderId));
    
    if (!senderWallet) {
      await db.insert(wallets).values({ userId: senderId, coinsBalance: 0, pointsBalance: 0 });
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }
    
    if ((senderWallet.coinsBalance || 0) < giftInfo.coins) {
      return NextResponse.json({ 
        error: 'Insufficient coins', 
        required: giftInfo.coins, 
        balance: senderWallet.coinsBalance 
      }, { status: 400 });
    }
    
    let [receiverWallet] = await db.select().from(wallets).where(eq(wallets.userId, receiverId));
    if (!receiverWallet) {
      await db.insert(wallets).values({ userId: receiverId, coinsBalance: 0, pointsBalance: 0 });
      [receiverWallet] = await db.select().from(wallets).where(eq(wallets.userId, receiverId));
    }
    
    const [sender] = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.id, senderId));
    
    const result = await db.transaction(async (tx) => {
      await tx.update(wallets)
        .set({ coinsBalance: sql`${wallets.coinsBalance} - ${giftInfo.coins}` })
        .where(eq(wallets.userId, senderId));
      
      await tx.update(wallets)
        .set({ 
          coinsBalance: sql`${wallets.coinsBalance} + ${giftInfo.coins}`,
          totalEarned: sql`${wallets.totalEarned} + ${giftInfo.coins}`
        })
        .where(eq(wallets.userId, receiverId));
      
      const [gift] = await tx.insert(gifts).values({
        senderId,
        receiverId,
        postId: postId || null,
        giftType,
        coinAmount: giftInfo.coins,
        message
      }).returning();
      
      await tx.insert(coinTransactions).values({
        userId: senderId,
        amount: -giftInfo.coins,
        transactionType: 'tip_sent',
        description: `Sent ${giftInfo.name} to user`,
        referenceId: gift.id
      });
      
      await tx.insert(coinTransactions).values({
        userId: receiverId,
        amount: giftInfo.coins,
        transactionType: 'tip_received',
        description: `Received ${giftInfo.name} gift`,
        referenceId: gift.id
      });
      
      await tx.insert(notifications).values({
        userId: receiverId,
        actorId: senderId,
        type: 'gift',
        title: `New Gift: ${giftInfo.name} ${giftInfo.icon}`,
        message: `${sender?.username || 'Someone'} sent you a ${giftInfo.name} ${giftInfo.icon} (${giftInfo.coins} coins)${message ? `: "${message}"` : ''}`,
        referenceId: postId || gift.id,
        referenceType: postId ? 'post' : 'gift'
      });
      
      return gift;
    });
    
    return NextResponse.json({ 
      success: true, 
      gift: result,
      giftInfo,
      newBalance: (senderWallet.coinsBalance || 0) - giftInfo.coins
    });
  } catch (error) {
    console.error('Tip error:', error);
    return NextResponse.json({ error: 'Failed to send tip' }, { status: 500 });
  }
}
