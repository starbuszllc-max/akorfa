import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles, userEvents } from '@akorfa/shared';
import { eq, desc, and, gte } from 'drizzle-orm';

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
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        activityDates: []
      });
    }

    const [profile] = await db.select({
      currentStreak: profiles.currentStreak,
      longestStreak: profiles.longestStreak,
      lastActiveDate: profiles.lastActiveDate
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const events = await db.select({
      createdAt: userEvents.createdAt
    })
    .from(userEvents)
    .where(
      and(
        eq(userEvents.userId, userId),
        gte(userEvents.createdAt, twelveMonthsAgo)
      )
    )
    .orderBy(desc(userEvents.createdAt));

    const activityDates = [...new Set(
      events.filter(e => e.createdAt).map(e => {
        const d = new Date(e.createdAt!);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )];

    return NextResponse.json({
      currentStreak: profile?.currentStreak || 0,
      longestStreak: profile?.longestStreak || 0,
      lastActivityDate: profile?.lastActiveDate || null,
      activityDates
    });
  } catch (error) {
    console.error('Streak fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [profile] = await db.select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const lastActive = profile.lastActiveDate;
    if (!lastActive) {
      const [updated] = await db.update(profiles)
        .set({
          currentStreak: 1,
          longestStreak: Math.max(1, profile.longestStreak || 0),
          lastActiveDate: todayStr
        })
        .where(eq(profiles.id, userId))
        .returning();

      await db.insert(userEvents).values({
        userId,
        eventType: 'daily_activity',
        pointsEarned: 2,
        metadata: { source: 'streak_update', streak: 1 }
      });

      return NextResponse.json({ streak: updated });
    }

    const lastDateStr = typeof lastActive === 'string' ? lastActive : lastActive;
    const lastDate = new Date(lastDateStr);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newCurrentStreak = profile.currentStreak || 0;
    if (daysDiff === 0) {
      return NextResponse.json({ streak: profile, message: 'Already recorded today' });
    } else if (daysDiff === 1) {
      newCurrentStreak += 1;
    } else {
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(newCurrentStreak, profile.longestStreak || 0);

    const [updated] = await db.update(profiles)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: todayStr
      })
      .where(eq(profiles.id, userId))
      .returning();

    await db.insert(userEvents).values({
      userId,
      eventType: 'daily_activity',
      pointsEarned: 2,
      metadata: { source: 'streak_update', streak: newCurrentStreak }
    });

    return NextResponse.json({ streak: updated });
  } catch (error) {
    console.error('Streak update error:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}
