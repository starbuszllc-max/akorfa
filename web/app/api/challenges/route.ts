import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { challenges, challengeParticipants, profiles, userEvents, wallets, pointsLog, notifications } from '@akorfa/shared';
import { calculateAkorfaScore } from '@akorfa/shared/src/scoring';
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

export async function PATCH(request: NextRequest) {
  try {
    const { userId, challengeId, action } = await request.json();
    
    if (!userId || !challengeId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (action === 'join') {
      const [existing] = await db.select()
        .from(challengeParticipants)
        .where(and(
          eq(challengeParticipants.challengeId, challengeId),
          eq(challengeParticipants.userId, userId)
        ));
      
      if (existing) {
        return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 });
      }
      
      await db.insert(challengeParticipants).values({
        challengeId,
        userId,
        status: 'active',
        progress: 0
      });
      
      await db.update(challenges)
        .set({ participantCount: sql`COALESCE(${challenges.participantCount}, 0) + 1` })
        .where(eq(challenges.id, challengeId));
      
      await db.insert(userEvents).values({
        userId,
        eventType: 'challenge_joined',
        pointsEarned: 5,
        metadata: { challengeId }
      });
      
      const scoreDelta = calculateAkorfaScore({ challengesJoined: 1 });
      await db.update(profiles)
        .set({
          akorfaScore: sql`COALESCE(${profiles.akorfaScore}, 0) + ${scoreDelta}`,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, userId));
      
      const [updatedChallenge] = await db.select({ participantCount: challenges.participantCount })
        .from(challenges)
        .where(eq(challenges.id, challengeId));
      
      return NextResponse.json({ 
        success: true, 
        joined: true,
        participantCount: updatedChallenge?.participantCount || 0
      });
    }
    
    if (action === 'complete') {
      const [participation] = await db.select()
        .from(challengeParticipants)
        .where(and(
          eq(challengeParticipants.challengeId, challengeId),
          eq(challengeParticipants.userId, userId)
        ));
      
      if (!participation) {
        return NextResponse.json({ error: 'Not participating in this challenge' }, { status: 400 });
      }
      
      if (participation.status === 'completed') {
        return NextResponse.json({ error: 'Already completed this challenge' }, { status: 400 });
      }
      
      const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId));
      
      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }
      
      await db.update(challengeParticipants)
        .set({ status: 'completed', completedAt: new Date() })
        .where(and(
          eq(challengeParticipants.challengeId, challengeId),
          eq(challengeParticipants.userId, userId)
        ));
      
      const reward = challenge.pointsReward || 50;
      
      await db.insert(pointsLog).values({
        userId,
        amount: reward,
        action: 'challenge_complete',
        description: `Completed challenge: ${challenge.title}`,
        referenceId: challengeId,
        referenceType: 'challenge'
      });
      
      const [existingWallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
      if (!existingWallet) {
        await db.insert(wallets).values({
          userId,
          pointsBalance: reward,
          coinsBalance: 0,
          totalEarned: reward
        });
      } else {
        await db.update(wallets)
          .set({ 
            pointsBalance: sql`COALESCE(${wallets.pointsBalance}, 0) + ${reward}`,
            totalEarned: sql`COALESCE(${wallets.totalEarned}, 0) + ${reward}`
          })
          .where(eq(wallets.userId, userId));
      }
      
      await db.update(profiles)
        .set({ totalXp: sql`COALESCE(${profiles.totalXp}, 0) + ${reward}` })
        .where(eq(profiles.id, userId));
      
      if (challenge.createdBy && challenge.createdBy !== userId) {
        const [completer] = await db.select({ username: profiles.username })
          .from(profiles)
          .where(eq(profiles.id, userId));
        
        await db.insert(notifications).values({
          userId: challenge.createdBy,
          actorId: userId,
          type: 'challenge_completed',
          title: 'Challenge Completed!',
          message: `${completer?.username || 'Someone'} completed your challenge "${challenge.title}"`,
          referenceId: challengeId,
          referenceType: 'challenge'
        });
      }
      
      return NextResponse.json({ success: true, reward });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Challenge update error:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}
