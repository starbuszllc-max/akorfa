import { NextResponse } from 'next/server';
import { db, pool } from '../../../../lib/db';
import { challenges, challengeParticipants, profiles, userEvents } from '@akorfa/shared/src/schema';
import { calculateAkorfaScore } from '@akorfa/shared/dist/scoring';
import { eq, sql, and } from 'drizzle-orm';

export async function POST(req: Request) {
  const client = await pool.connect();
  
  try {
    const body = await req.json();
    const { challenge_id, user_id } = body;

    if (!challenge_id || !user_id) {
      client.release();
      return NextResponse.json({ error: 'challenge_id and user_id are required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(challengeParticipants)
      .where(
        and(
          eq(challengeParticipants.challengeId, challenge_id),
          eq(challengeParticipants.userId, user_id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      client.release();
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 });
    }

    await client.query('BEGIN');

    try {
      const [participation] = await db.insert(challengeParticipants).values({
        challengeId: challenge_id,
        userId: user_id,
        status: 'active',
        progress: 0
      }).returning();

      await db.update(challenges)
        .set({
          participantCount: sql`COALESCE(${challenges.participantCount}, 0) + 1`
        })
        .where(eq(challenges.id, challenge_id));

      await db.insert(userEvents).values({
        userId: user_id,
        eventType: 'challenge_joined',
        pointsEarned: 5,
        metadata: { challenge_id }
      });

      const scoreDelta = calculateAkorfaScore({ challengesJoined: 1 });
      await db.update(profiles)
        .set({
          akorfaScore: sql`COALESCE(${profiles.akorfaScore}, 0) + ${scoreDelta}`,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, user_id));

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({ participation });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    }
  } catch (err: any) {
    client.release();
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
