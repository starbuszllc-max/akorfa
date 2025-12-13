import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyDigests, userEvents, profiles, posts, challengeParticipants } from '@akorfa/shared';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import OpenAI from 'openai';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getOpenAI() {
  return new OpenAI();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ digests: [] });
    }

    const digests = await db
      .select()
      .from(dailyDigests)
      .where(eq(dailyDigests.userId, userId))
      .orderBy(desc(dailyDigests.createdAt))
      .limit(7);

    return NextResponse.json({ digests });
  } catch (error) {
    console.error('Digest fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch digests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const existingDigest = await db
      .select()
      .from(dailyDigests)
      .where(and(
        eq(dailyDigests.userId, userId),
        eq(dailyDigests.digestDate, todayStr)
      ))
      .limit(1);

    if (existingDigest.length > 0) {
      return NextResponse.json({ digest: existingDigest[0] });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const recentEvents = await db
      .select()
      .from(userEvents)
      .where(and(
        eq(userEvents.userId, userId),
        gte(userEvents.createdAt, yesterday)
      ))
      .orderBy(desc(userEvents.createdAt));

    const recentPosts = await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        gte(posts.createdAt, yesterday)
      ))
      .limit(10);

    const challenges = await db
      .select()
      .from(challengeParticipants)
      .where(and(
        eq(challengeParticipants.userId, userId),
        eq(challengeParticipants.status, 'active')
      ));

    const totalPoints = recentEvents.reduce((sum, e) => sum + (e.pointsEarned || 0), 0);
    const eventTypes = [...new Set(recentEvents.map(e => e.eventType))];

    const stats = {
      pointsEarned: totalPoints,
      postsCreated: recentPosts.length,
      activeChallenges: challenges.length,
      activitiesCompleted: recentEvents.length,
      streak: profile?.currentStreak || 0
    };

    const highlights = [
      totalPoints > 0 ? `Earned ${totalPoints} points` : null,
      recentPosts.length > 0 ? `Created ${recentPosts.length} post${recentPosts.length > 1 ? 's' : ''}` : null,
      challenges.length > 0 ? `Working on ${challenges.length} challenge${challenges.length > 1 ? 's' : ''}` : null,
      profile?.currentStreak && profile.currentStreak > 1 ? `${profile.currentStreak} day streak going!` : null
    ].filter(Boolean);

    let summary = '';
    let title = 'Your Daily Summary';
    let recommendations: string[] = [];

    try {
      const aiResponse = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a supportive AI coach for the Akorfa self-discovery app. Generate a brief, encouraging daily digest for the user. Keep it personal and motivating. Response in JSON format with title, summary (2-3 sentences), and recommendations (array of 2-3 short actionable tips).`
          },
          {
            role: 'user',
            content: JSON.stringify({
              username: profile?.username || 'User',
              stats,
              eventTypes,
              layerScores: profile?.layerScores || {},
              streak: profile?.currentStreak || 0
            })
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300
      });

      const parsed = JSON.parse(aiResponse.choices[0].message.content || '{}');
      title = parsed.title || title;
      summary = parsed.summary || `Great progress today! You earned ${totalPoints} points and stayed active.`;
      recommendations = parsed.recommendations || [];
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      summary = totalPoints > 0
        ? `You earned ${totalPoints} points today and completed ${recentEvents.length} activities. Keep up the great work!`
        : `It's a new day for growth! Check out today's challenges and take a step toward your goals.`;
      recommendations = [
        'Take a quick assessment to track your progress',
        'Join a challenge to stay motivated',
        'Connect with your accountability pod'
      ];
    }

    const [newDigest] = await db
      .insert(dailyDigests)
      .values({
        userId,
        digestDate: todayStr,
        title,
        summary,
        highlights,
        stats,
        recommendations,
        isRead: false
      })
      .returning();

    return NextResponse.json({ digest: newDigest });
  } catch (error) {
    console.error('Digest creation error:', error);
    return NextResponse.json({ error: 'Failed to create digest' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { digestId, userId } = body;

    if (!digestId || !UUID_REGEX.test(digestId)) {
      return NextResponse.json({ error: 'Valid digestId required' }, { status: 400 });
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    await db
      .update(dailyDigests)
      .set({ isRead: true })
      .where(and(
        eq(dailyDigests.id, digestId),
        eq(dailyDigests.userId, userId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Digest update error:', error);
    return NextResponse.json({ error: 'Failed to update digest' }, { status: 500 });
  }
}
