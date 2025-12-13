import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { follows, wallets, profiles } from '@akorfa/shared';
import { eq, and, sql, desc } from 'drizzle-orm';

const CREATOR_LEVELS = {
  1: { name: 'Starter', minFollowers: 0, canMonetize: false },
  2: { name: 'Verified Contributor', minFollowers: 500, canMonetize: true },
  3: { name: 'Expert Coach', minFollowers: 1500, canMonetize: true },
  4: { name: 'Akorfa Ambassador', minFollowers: 5000, canMonetize: true }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const followerId = searchParams.get('follower_id');
    const followingId = searchParams.get('following_id');

    if (followerId && followingId) {
      if (!UUID_REGEX.test(followerId) || !UUID_REGEX.test(followingId)) {
        return NextResponse.json({ isFollowing: false });
      }
      const [existing] = await db.select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      return NextResponse.json({ isFollowing: !!existing });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({
        followerCount: 0,
        creatorLevel: 1,
        levelInfo: CREATOR_LEVELS[1],
        nextLevel: CREATOR_LEVELS[2],
        allLevels: CREATOR_LEVELS
      });
    }

    if (type === 'followers') {
      const followers = await db.select({
        id: follows.id,
        followerId: follows.followerId,
        createdAt: follows.createdAt
      })
        .from(follows)
        .where(eq(follows.followingId, userId))
        .orderBy(desc(follows.createdAt));

      return NextResponse.json({ followers, count: followers.length });
    }

    if (type === 'following') {
      const following = await db.select({
        id: follows.id,
        followingId: follows.followingId,
        createdAt: follows.createdAt
      })
        .from(follows)
        .where(eq(follows.followerId, userId))
        .orderBy(desc(follows.createdAt));

      return NextResponse.json({ following, count: following.length });
    }

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    const followerCount = wallet?.followerCount || 0;

    let currentLevel = 1;
    for (const [level, config] of Object.entries(CREATOR_LEVELS)) {
      if (followerCount >= config.minFollowers) {
        currentLevel = parseInt(level);
      }
    }

    return NextResponse.json({
      followerCount,
      creatorLevel: currentLevel,
      levelInfo: CREATOR_LEVELS[currentLevel as keyof typeof CREATOR_LEVELS],
      nextLevel: CREATOR_LEVELS[(currentLevel + 1) as keyof typeof CREATOR_LEVELS] || null,
      allLevels: CREATOR_LEVELS
    });
  } catch (error) {
    console.error('Follows fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { followerId, followingId, action } = body;

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'followerId and followingId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(followerId) || !UUID_REGEX.test(followingId)) {
      return NextResponse.json({ error: 'Valid UUIDs required for follow operations' }, { status: 400 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const [existing] = await db.select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    if (action === 'unfollow') {
      if (existing) {
        await db.delete(follows)
          .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

        await db.update(wallets)
          .set({
            followerCount: sql`GREATEST(${wallets.followerCount} - 1, 0)`,
            updatedAt: new Date()
          })
          .where(eq(wallets.userId, followingId));
      }
      return NextResponse.json({ success: true, following: false });
    }

    if (existing) {
      return NextResponse.json({ success: true, following: true, message: 'Already following' });
    }

    await db.insert(follows).values({ followerId, followingId });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, followingId));

    if (wallet) {
      const newFollowerCount = (wallet.followerCount || 0) + 1;
      
      let newLevel = 1;
      let canMonetize = false;
      for (const [level, config] of Object.entries(CREATOR_LEVELS)) {
        if (newFollowerCount >= config.minFollowers) {
          newLevel = parseInt(level);
          canMonetize = config.canMonetize;
        }
      }

      await db.update(wallets)
        .set({
          followerCount: newFollowerCount,
          creatorLevel: newLevel,
          canMonetize,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, followingId));
    } else {
      await db.insert(wallets).values({
        userId: followingId,
        followerCount: 1,
        pointsBalance: 0,
        coinsBalance: 0,
        creatorLevel: 1
      });
    }

    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error('Follow action error:', error);
    return NextResponse.json({ error: 'Failed to process follow' }, { status: 500 });
  }
}
