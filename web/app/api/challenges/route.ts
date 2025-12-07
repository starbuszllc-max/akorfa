import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { challenges, challengeParticipants, profiles, userEvents } from '@akorfa/shared/src/schema';
import { calculateAkorfaScore } from '@akorfa/shared/dist/scoring';
import { eq, desc, sql, and, gt } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const now = new Date();

    const allChallenges = await db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        layer: challenges.layer,
        durationDays: challenges.durationDays,
        pointsReward: challenges.pointsReward,
        createdBy: challenges.createdBy,
        startsAt: challenges.startsAt,
        endsAt: challenges.endsAt,
        participantCount: challenges.participantCount,
        isActive: challenges.isActive,
        createdAt: challenges.createdAt,
        creator: {
          username: profiles.username,
          avatarUrl: profiles.avatarUrl
        }
      })
      .from(challenges)
      .leftJoin(profiles, eq(challenges.createdBy, profiles.id))
      .where(and(
        eq(challenges.isActive, true),
        gt(challenges.endsAt, now)
      ))
      .orderBy(desc(challenges.createdAt))
      .limit(50);

    let userParticipations: string[] = [];
    if (userId) {
      const participations = await db
        .select({ challengeId: challengeParticipants.challengeId })
        .from(challengeParticipants)
        .where(eq(challengeParticipants.userId, userId));
      userParticipations = participations.map(p => p.challengeId!);
    }

    return NextResponse.json({ 
      challenges: allChallenges,
      userParticipations 
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, layer, duration_days, points_reward, user_id } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const durationDays = duration_days ?? 7;
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const [newChallenge] = await db.insert(challenges).values({
      title,
      description,
      layer: layer ?? 'social',
      durationDays,
      pointsReward: points_reward ?? 50,
      createdBy: user_id ?? null,
      startsAt,
      endsAt
    }).returning();

    if (user_id) {
      await db.insert(userEvents).values({
        userId: user_id,
        eventType: 'challenge_created',
        pointsEarned: 10,
        metadata: { challenge_id: newChallenge.id }
      });

      const scoreDelta = calculateAkorfaScore({ challengesJoined: 1 });
      await db.update(profiles)
        .set({
          akorfaScore: sql`COALESCE(${profiles.akorfaScore}, 0) + ${scoreDelta}`,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, user_id));
    }

    return NextResponse.json({ challenge: newChallenge });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
