import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { follows, profiles, notifications } from '@akorfa/shared/src/schema';
import { eq, and, sql, count } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (type === 'followers') {
      const followers = await db
        .select({
          id: profiles.id,
          username: profiles.username,
          avatarUrl: profiles.avatarUrl,
          followedAt: follows.createdAt
        })
        .from(follows)
        .innerJoin(profiles, eq(follows.followerId, profiles.id))
        .where(eq(follows.followingId, userId));

      return NextResponse.json({ followers });
    }

    if (type === 'following') {
      const following = await db
        .select({
          id: profiles.id,
          username: profiles.username,
          avatarUrl: profiles.avatarUrl,
          followedAt: follows.createdAt
        })
        .from(follows)
        .innerJoin(profiles, eq(follows.followingId, profiles.id))
        .where(eq(follows.followerId, userId));

      return NextResponse.json({ following });
    }

    const [followersCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingCount] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return NextResponse.json({
      followers: followersCount?.count || 0,
      following: followingCount?.count || 0
    });
  } catch (error) {
    console.error('Follow GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { followerId, followingId } = await req.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'followerId and followingId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(followerId) || !UUID_REGEX.test(followingId)) {
      return NextResponse.json({ error: 'Valid UUIDs required' }, { status: 400 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 });
    }

    await db.insert(follows).values({
      followerId,
      followingId
    });

    const [follower] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.id, followerId));

    await db.insert(notifications).values({
      userId: followingId,
      actorId: followerId,
      type: 'follow',
      title: 'New Follower',
      message: `${follower?.username || 'Someone'} started following you`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow POST error:', error);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { followerId, followingId } = await req.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'followerId and followingId required' }, { status: 400 });
    }

    await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
  }
}
