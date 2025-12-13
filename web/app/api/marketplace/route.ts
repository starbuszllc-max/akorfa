import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { marketplaceItems, userItems, wallets } from '@akorfa/shared';
import { eq, and, sql, desc } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const itemType = searchParams.get('type');

    let items: any[] = [];
    try {
      const query = db.select().from(marketplaceItems).where(eq(marketplaceItems.isActive, true));
      items = await query.orderBy(desc(marketplaceItems.createdAt));
    } catch {
      items = [];
    }

    const filteredItems = itemType 
      ? items.filter((item: any) => item.itemType === itemType)
      : items;

    let ownedItems: string[] = [];
    if (userId && UUID_REGEX.test(userId)) {
      try {
        const owned = await db.select()
          .from(userItems)
          .where(eq(userItems.userId, userId));
        ownedItems = owned.map((o: any) => o.itemId);
      } catch {
        ownedItems = [];
      }
    }

    return NextResponse.json({
      items: filteredItems.map(item => ({
        ...item,
        owned: ownedItems.includes(item.id)
      })),
      categories: ['frame', 'sticker', 'boost', 'badge', 'avatar']
    });
  } catch (error) {
    console.error('Marketplace fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId, action } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: 'userId and itemId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid UUID userId required for purchases' }, { status: 400 });
    }

    if (action === 'equip') {
      const [owned] = await db.select()
        .from(userItems)
        .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)));

      if (!owned) {
        return NextResponse.json({ error: 'Item not owned' }, { status: 400 });
      }

      const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, itemId));

      await db.update(userItems)
        .set({ isEquipped: false })
        .where(eq(userItems.userId, userId));

      await db.update(userItems)
        .set({ isEquipped: true })
        .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)));

      return NextResponse.json({ success: true, equipped: item });
    }

    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, itemId));
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const [existing] = await db.select()
      .from(userItems)
      .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)));

    if (existing) {
      return NextResponse.json({ error: 'Already owned' }, { status: 400 });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet || (wallet.coinsBalance || 0) < item.coinPrice) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    await db.update(wallets)
      .set({
        coinsBalance: sql`${wallets.coinsBalance} - ${item.coinPrice}`,
        updatedAt: new Date()
      })
      .where(eq(wallets.userId, userId));

    await db.insert(userItems).values({
      userId,
      itemId
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Marketplace purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase' }, { status: 500 });
  }
}
