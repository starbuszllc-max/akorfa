import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { badges, userBadges, profiles, posts, comments, challengeParticipants, assessments } from '@akorfa/shared';
import { eq, count, and } from 'drizzle-orm';

type BadgeRow = typeof badges.$inferSelect;
type UserBadgeRow = typeof userBadges.$inferSelect;

const DEFAULT_BADGES = [
  { name: 'First Post', description: 'Create your first post', icon: 'pencil', layer: null, requirementType: 'posts_created', requirementValue: 1 },
  { name: 'Storyteller', description: 'Create 10 posts', icon: 'book', layer: null, requirementType: 'posts_created', requirementValue: 10 },
  { name: 'Prolific Writer', description: 'Create 50 posts', icon: 'feather', layer: null, requirementType: 'posts_created', requirementValue: 50 },
  { name: 'Commenter', description: 'Leave 5 comments', icon: 'message-circle', layer: null, requirementType: 'comments_made', requirementValue: 5 },
  { name: 'Active Discusser', description: 'Leave 25 comments', icon: 'messages', layer: null, requirementType: 'comments_made', requirementValue: 25 },
  { name: 'Challenger', description: 'Join your first challenge', icon: 'trophy', layer: null, requirementType: 'challenges_joined', requirementValue: 1 },
  { name: 'Challenge Champion', description: 'Complete 5 challenges', icon: 'award', layer: null, requirementType: 'challenges_completed', requirementValue: 5 },
  { name: 'Self-Aware', description: 'Complete your first assessment', icon: 'clipboard-check', layer: null, requirementType: 'assessments_completed', requirementValue: 1 },
  { name: 'Explorer', description: 'Reach AkorfaScore of 50', icon: 'compass', layer: null, requirementType: 'akorfa_score', requirementValue: 50 },
  { name: 'Practitioner', description: 'Reach AkorfaScore of 200', icon: 'target', layer: null, requirementType: 'akorfa_score', requirementValue: 200 },
  { name: 'Adept', description: 'Reach AkorfaScore of 500', icon: 'zap', layer: null, requirementType: 'akorfa_score', requirementValue: 500 },
  { name: 'Master', description: 'Reach AkorfaScore of 1000', icon: 'crown', layer: null, requirementType: 'akorfa_score', requirementValue: 1000 },
];

async function seedBadges() {
  const existingBadges = await db.select().from(badges);
  if (existingBadges.length === 0) {
    for (const badge of DEFAULT_BADGES) {
      await db.insert(badges).values(badge);
    }
  }
}

async function getUserStats(userId: string) {
  const [postsCount] = await db.select({ count: count() }).from(posts).where(eq(posts.userId, userId));
  const [commentsCount] = await db.select({ count: count() }).from(comments).where(eq(comments.userId, userId));
  const [challengesJoined] = await db.select({ count: count() }).from(challengeParticipants).where(eq(challengeParticipants.userId, userId));
  const [challengesCompleted] = await db.select({ count: count() }).from(challengeParticipants).where(and(eq(challengeParticipants.userId, userId), eq(challengeParticipants.status, 'completed')));
  const [assessmentsCount] = await db.select({ count: count() }).from(assessments).where(eq(assessments.userId, userId));
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));

  return {
    posts_created: postsCount?.count || 0,
    comments_made: commentsCount?.count || 0,
    challenges_joined: challengesJoined?.count || 0,
    challenges_completed: challengesCompleted?.count || 0,
    assessments_completed: assessmentsCount?.count || 0,
    akorfa_score: Number(profile?.akorfaScore || 0)
  };
}

async function checkAndAwardBadges(userId: string) {
  const stats = await getUserStats(userId);
  const allBadges = await db.select().from(badges);
  const earnedBadges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const earnedBadgeIds = new Set(earnedBadges.map((b: UserBadgeRow) => b.badgeId));

  const newBadges = [];
  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const statValue = stats[badge.requirementType as keyof typeof stats] || 0;
    if (statValue >= badge.requirementValue) {
      try {
        await db.insert(userBadges).values({ userId, badgeId: badge.id });
        newBadges.push(badge);
      } catch {
        // Badge already awarded (unique constraint violation), skip
      }
    }
  }

  return newBadges;
}

export async function GET(request: NextRequest) {
  try {
    await seedBadges();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const newlyEarned = await checkAndAwardBadges(userId);

      const earned = await db
        .select({
          id: badges.id,
          name: badges.name,
          description: badges.description,
          icon: badges.icon,
          layer: badges.layer,
          earnedAt: userBadges.earnedAt
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, userId));

      const allBadges = await db.select().from(badges);
      const earnedIds = new Set(earned.map((b: { id: string }) => b.id));
      const locked = allBadges.filter((b: BadgeRow) => !earnedIds.has(b.id));

      return NextResponse.json({ earned, locked, newlyEarned });
    }

    const allBadges = await db.select().from(badges);
    return NextResponse.json(allBadges);
  } catch (error) {
    console.error('Badges GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}
