import { NextResponse } from 'next/server';
import { getOpenAI, hasOpenAIKey } from '../../../lib/openai';
import { db } from '../../../lib/db';
import { profiles, assessments, posts, userEvents, challengeParticipants } from '@akorfa/shared';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id query param required' }, { status: 400 });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentAssessments, recentPosts, recentEvents, activeChallenges] = await Promise.all([
      db.select().from(assessments).where(eq(assessments.userId, userId)).orderBy(desc(assessments.createdAt)).limit(3),
      db.select().from(posts).where(and(eq(posts.userId, userId), gte(posts.createdAt, sevenDaysAgo))),
      db.select().from(userEvents).where(and(eq(userEvents.userId, userId), gte(userEvents.createdAt, sevenDaysAgo))),
      db.select().from(challengeParticipants).where(and(eq(challengeParticipants.userId, userId), eq(challengeParticipants.status, 'active')))
    ]);

    const totalPoints = recentEvents.reduce((sum, e) => sum + (e.pointsEarned || 0), 0);

    let insight;

    if (hasOpenAIKey()) {
      const openai = getOpenAI();
      const systemPrompt = `You are an insightful AI coach for personal development. Generate a brief, personalized daily insight based on the user's activity data.

User Data:
- Akorfa Score: ${profile.akorfaScore || 0}
- Layer Scores: ${JSON.stringify(profile.layerScores || {})}
- Recent Assessments: ${recentAssessments.length}
- Posts This Week: ${recentPosts.length}
- Points Earned This Week: ${totalPoints}
- Active Challenges: ${activeChallenges.length}

Generate a JSON response with:
{
  "greeting": "A personalized greeting based on time of day and their name if available",
  "insight": "A 2-3 sentence personalized insight about their recent activity or growth opportunity",
  "focusArea": "One layer they should focus on today (environment, biological, internal, cultural, social, conscious, or existential)",
  "actionItem": "One specific, actionable thing they can do today",
  "motivation": "A short motivational message (1 sentence)"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my daily insight.' }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300
      });

      insight = JSON.parse(response.choices[0].message.content || '{}');
    } else {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!';
      
      insight = {
        greeting,
        insight: 'Take some time today to reflect on your personal growth journey. Small consistent steps lead to remarkable transformations.',
        focusArea: 'internal',
        actionItem: 'Spend 5 minutes journaling about one thing you are grateful for today.',
        motivation: 'Every day is a new opportunity to become a better version of yourself!'
      };
    }

    return NextResponse.json({
      insight,
      stats: {
        akorfaScore: profile.akorfaScore,
        postsThisWeek: recentPosts.length,
        pointsThisWeek: totalPoints,
        activeChallenges: activeChallenges.length
      }
    });
  } catch (err: any) {
    console.error('Insights error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
