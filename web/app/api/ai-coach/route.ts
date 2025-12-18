import { NextResponse } from 'next/server';
import { getAIClient, hasOpenAIKey, createChatCompletion, getOpenAI } from '../../../lib/openai';
import { db } from '@/lib/db';
import { profiles, assessments, posts, challengeParticipants, userBadges } from '@akorfa/shared';
import { eq, desc } from 'drizzle-orm';

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

    const context = await getUserContext(user_id);

    const aiClient = getAIClient();
    if (!aiClient) {
      return NextResponse.json({ 
        message: `Hello! I'm your AI coach. I can see you're on your personal growth journey. Your Akorfa score is currently ${context.profile?.akorfaScore || 0}. To get personalized insights, please configure OpenAI in your environment variables. In the meantime, I'd suggest focusing on your lowest-scoring layer for the biggest impact!`,
        context: {
          score: context.profile?.akorfaScore,
          layerScores: context.profile?.layerScores,
          hasAssessment: !!context.assessment
        }
      });
    }

    const systemPrompt = `You are an empathetic and insightful AI Personal Growth Coach for the Akorfa platform. Akorfa focuses on human development through the Seven Layers framework:

1. Environment - Physical surroundings, living space, nature connection
2. Biological - Health, fitness, energy, nutrition
3. Internal - Emotions, mental health, self-awareness
4. Cultural - Values, traditions, identity, heritage
5. Social - Relationships, community, communication
6. Conscious - Awareness, mindfulness, presence
7. Existential - Purpose, meaning, spiritual connection

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

    const response = await createChatCompletion({
      model: 'gpt-4o-mini',
      messages: messages as any,
      max_tokens: 1024
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

    const context = await getUserContext(userId);

    if (!hasOpenAIKey()) {
      return NextResponse.json({ 
        suggestions: [
          { title: 'Complete an Assessment', description: 'Take your first assessment to get personalized insights', layer: 'internal' },
          { title: 'Join a Challenge', description: 'Participate in a community challenge to boost your growth', layer: 'social' },
          { title: 'Daily Reflection', description: 'Spend 5 minutes reflecting on your goals today', layer: 'conscious' }
        ],
        context: {
          score: context.profile?.akorfaScore,
          hasAssessment: !!context.assessment
        }
      });
    }

    const openai = getOpenAI();

    const systemPrompt = `You are an AI Personal Growth Coach for Akorfa. Based on the user's data, generate 3 personalized growth suggestions.

User Context:
- Akorfa Score: ${context.profile?.akorfaScore || 0}
- Layer Scores: ${JSON.stringify(context.profile?.layerScores || {})}
- Latest Assessment: ${context.assessment ? JSON.stringify(context.assessment.layerScores) : 'No assessment yet'}
- Challenges Completed: ${context.completedChallenges}/${context.challengeCount}
- Badges: ${context.badgeCount}

Respond with JSON in this format: { "suggestions": [{ "title": "short title", "description": "one sentence description", "layer": "one of the seven layers" }] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate my personalized growth suggestions.' }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 512
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
