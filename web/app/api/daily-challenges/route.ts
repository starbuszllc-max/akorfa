import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { dailyChallenges, dailyChallengeCompletions, wallets, profiles } from '@akorfa/shared';
import { eq, and, gte, desc, sql, or, isNull } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    const now = new Date();
    const challenges = await db.select()
      .from(dailyChallenges)
      .where(and(
        eq(dailyChallenges.isActive, true),
        or(
          isNull(dailyChallenges.expiresAt),
          gte(dailyChallenges.expiresAt, now)
        )
      ))
      .orderBy(desc(dailyChallenges.createdAt))
      .limit(10);

    let completedIds: string[] = [];
    if (userId) {
      const completions = await db.select({ challengeId: dailyChallengeCompletions.challengeId })
        .from(dailyChallengeCompletions)
        .where(eq(dailyChallengeCompletions.userId, userId));
      completedIds = completions.map(c => c.challengeId!);
    }

    const challengesWithStatus = challenges.map(c => ({
      ...c,
      isCompleted: completedIds.includes(c.id)
    }));

    return NextResponse.json({ challenges: challengesWithStatus });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, challenge_id, post_id } = body;

    if (!user_id || !challenge_id) {
      return NextResponse.json({ error: 'user_id and challenge_id required' }, { status: 400 });
    }

    const existing = await db.select().from(dailyChallengeCompletions)
      .where(and(
        eq(dailyChallengeCompletions.userId, user_id),
        eq(dailyChallengeCompletions.challengeId, challenge_id)
      )).limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 });
    }

    const [challenge] = await db.select().from(dailyChallenges)
      .where(eq(dailyChallenges.id, challenge_id)).limit(1);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const [completion] = await db.insert(dailyChallengeCompletions).values({
      userId: user_id,
      challengeId: challenge_id,
      postId: post_id || null
    }).returning();

    if (challenge.pointsReward && challenge.pointsReward > 0) {
      await db.update(profiles)
        .set({ totalXp: sql`COALESCE(${profiles.totalXp}, 0) + ${challenge.pointsReward}` })
        .where(eq(profiles.id, user_id));
    }

    if (challenge.coinReward && challenge.coinReward > 0) {
      await db.update(wallets)
        .set({ coinsBalance: sql`COALESCE(${wallets.coinsBalance}, 0) + ${challenge.coinReward}` })
        .where(eq(wallets.userId, user_id));
    }

    return NextResponse.json({ 
      completion,
      rewards: {
        points: challenge.pointsReward || 0,
        coins: challenge.coinReward || 0
      }
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
