import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../../lib/db';
import { profiles, assessments, posts, comments, challengeParticipants, userBadges } from '@akorfa/shared/src/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getUserContext(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  
  const latestAssessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(desc(assessments.createdAt))
    .limit(1);

  const userPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(5);

  const userChallenges = await db
    .select()
    .from(challengeParticipants)
    .where(eq(challengeParticipants.userId, userId))
    .limit(10);

  const earnedBadges = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId));

  return {
    profile,
    assessment: latestAssessment[0] || null,
    recentPosts: userPosts,
    challengeCount: userChallenges.length,
    completedChallenges: userChallenges.filter(c => c.status === 'completed').length,
    badgeCount: earnedBadges.length
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, message, conversation_history = [] } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const context = await getUserContext(user_id);

    const systemPrompt = `You are an empathetic and insightful AI Personal Growth Coach for the Akorfa platform. Akorfa focuses on human development through the Seven Layers framework:

1. Physical - Health, fitness, energy management
2. Emotional - Emotional intelligence, regulation, expression
3. Mental - Cognitive abilities, learning, problem-solving
4. Social - Relationships, communication, community
5. Professional - Career, skills, work-life balance
6. Spiritual - Purpose, values, meaning
7. Financial - Money management, abundance mindset

User Context:
- Username: ${context.profile?.username || 'Unknown'}
- Akorfa Score: ${context.profile?.akorfaScore || 0}
- Layer Scores: ${JSON.stringify(context.profile?.layerScores || {})}
- Latest Assessment: ${context.assessment ? JSON.stringify(context.assessment.layerScores) : 'No assessment yet'}
- Recent Activity: ${context.recentPosts.length} recent posts
- Challenges: ${context.completedChallenges}/${context.challengeCount} completed
- Badges Earned: ${context.badgeCount}

Your role:
- Provide personalized insights based on their scores and activity
- Suggest specific actions to improve their weaker layers
- Celebrate their achievements and progress
- Recommend challenges that align with their growth areas
- Be warm, encouraging, and specific in your advice
- Keep responses concise but actionable (2-3 paragraphs max)
- If they haven't done an assessment, encourage them to take one first`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages,
      max_completion_tokens: 1024
    });

    const coachMessage = response.choices[0].message.content;

    return NextResponse.json({ 
      message: coachMessage,
      context: {
        score: context.profile?.akorfaScore,
        layerScores: context.profile?.layerScores,
        hasAssessment: !!context.assessment
      }
    });
  } catch (err: any) {
    console.error('AI Coach error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id query param required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const context = await getUserContext(userId);

    const systemPrompt = `You are an AI Personal Growth Coach for Akorfa. Based on the user's data, generate 3 personalized growth suggestions.

User Context:
- Akorfa Score: ${context.profile?.akorfaScore || 0}
- Layer Scores: ${JSON.stringify(context.profile?.layerScores || {})}
- Latest Assessment: ${context.assessment ? JSON.stringify(context.assessment.layerScores) : 'No assessment yet'}
- Challenges Completed: ${context.completedChallenges}/${context.challengeCount}
- Badges: ${context.badgeCount}

Respond with JSON in this format: { "suggestions": [{ "title": "short title", "description": "one sentence description", "layer": "one of the seven layers" }] }`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate my personalized growth suggestions.' }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 512
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return NextResponse.json({ 
      suggestions: result.suggestions || [],
      context: {
        score: context.profile?.akorfaScore,
        hasAssessment: !!context.assessment
      }
    });
  } catch (err: any) {
    console.error('AI Coach suggestions error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
