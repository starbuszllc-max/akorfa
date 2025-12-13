import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { postScores, posts, wallets, pointsLog } from '@akorfa/shared';
import { eq, sql, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const LAYERS = ['environment', 'bio', 'internal', 'cultural', 'social', 'conscious', 'existential'];

function getOpenAIClient() {
  return new OpenAI();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 });
    }

    const [score] = await db.select()
      .from(postScores)
      .where(eq(postScores.postId, postId));

    return NextResponse.json({ score });
  } catch (error) {
    console.error('AI score fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 });
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const [existingScore] = await db.select()
      .from(postScores)
      .where(eq(postScores.postId, postId));

    if (existingScore) {
      return NextResponse.json({ score: existingScore, cached: true });
    }

    const prompt = `Analyze this post for personal growth value using the 7-Layer Human Stability Framework (Environment, Bio, Internal, Cultural, Social, Conscious, Existential).

Post content: "${post.content}"

Return a JSON object with:
1. qualityScore (0-100): Overall quality and helpfulness
2. layerImpact: Object with each layer and score (-10 to +10) for how much this post impacts that layer
3. isHelpful (boolean): Is this genuinely helpful for personal growth?
4. analysis: Brief analysis (max 100 chars)
5. bonusPoints (0-20): Extra points if post is exceptional

Example response:
{
  "qualityScore": 75,
  "layerImpact": {"environment": 2, "bio": 5, "internal": 8, "cultural": 0, "social": 3, "conscious": 6, "existential": 4},
  "isHelpful": true,
  "analysis": "Insightful reflection on emotional resilience",
  "bonusPoints": 5
}

Return ONLY valid JSON.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    const [score] = await db.insert(postScores).values({
      postId,
      qualityScore: result.qualityScore || 50,
      layerImpact: result.layerImpact || {},
      isHelpful: result.isHelpful || false,
      aiAnalysis: result.analysis || '',
      bonusPoints: result.bonusPoints || 0
    }).returning();

    if (post.userId && result.bonusPoints > 0) {
      await db.insert(pointsLog).values({
        userId: post.userId,
        amount: result.bonusPoints,
        action: 'ai_bonus',
        description: `AI quality bonus for helpful post`,
        referenceId: postId,
        referenceType: 'post'
      });

      await db.update(wallets)
        .set({
          pointsBalance: sql`${wallets.pointsBalance} + ${result.bonusPoints}`,
          totalEarned: sql`${wallets.totalEarned} + ${result.bonusPoints}`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, post.userId));
    }

    return NextResponse.json({ score, analyzed: true });
  } catch (error) {
    console.error('AI score error:', error);
    return NextResponse.json({ error: 'Failed to analyze post' }, { status: 500 });
  }
}
