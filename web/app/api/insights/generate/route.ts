import { NextResponse } from 'next/server';
import { getAIClient, hasOpenAIKey } from '../../../../lib/openai';
import { db } from '../../../../lib/db';
import { profiles, assessments, dailyInsights } from '@akorfa/shared';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const layerNames = ['environment', 'biological', 'internal', 'cultural', 'social', 'conscious', 'existential'];

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, user_id)).limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const recentAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, user_id))
      .orderBy(desc(assessments.createdAt))
      .limit(5);

    const goals = profile.goals || [];
    const focusLayers = (profile.metadata as any)?.focusLayers || [];
    const randomLayer = focusLayers.length > 0 
      ? focusLayers[Math.floor(Math.random() * focusLayers.length)]
      : layerNames[Math.floor(Math.random() * layerNames.length)];

    let insight;
    
    const aiClient = getAIClient();
    if (aiClient) {
      const systemPrompt = `You are an insightful wellness coach. Generate a personalized daily insight for someone on their self-discovery journey.

User Context:
- Name: ${profile.fullName || 'Friend'}
- Goals: ${JSON.stringify(goals)}
- Focus Layers: ${focusLayers.join(', ') || 'all layers'}
- Current Akorfa Score: ${profile.akorfaScore || 0}
- Layer Scores: ${JSON.stringify(profile.layerScores || {})}
- Recent Assessments: ${recentAssessments.length}
- Today's Focus: ${randomLayer} layer

Generate a JSON response:
{
  "title": "A catchy, inspiring title (max 50 chars)",
  "content": "2-3 sentences of personalized insight about their ${randomLayer} layer and how to improve it today. Be specific and actionable.",
  "deepExplanation": "A detailed explanation (4-6 sentences) in simple, everyday language that helps a common person understand: 1) What this layer represents in their life, 2) Why it matters for their wellbeing, 3) How it connects to their other life areas, 4) Practical examples of how this insight applies to daily life. Use analogies and relatable examples. Avoid jargon.",
  "whyItMatters": "1-2 sentences explaining why focusing on this specific insight today will benefit them in simple terms.",
  "actionItems": ["First action item with clear steps", "Second action item with clear steps", "Third action item with clear steps"]
}

Make it personal, warm, and motivating. Reference their goals if possible. The deepExplanation should feel like a wise friend explaining complex concepts in simple terms that anyone can understand.`;

      const response = await aiClient.chat.completions.create({
        model: hasOpenAIKey() ? 'gpt-4o-mini' : 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate my personalized daily insight.' }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600
      });
      insight = JSON.parse(response.choices[0].message.content || '{}');
    } else {
      const layerExplanations: Record<string, string> = {
        environment: "Your environment layer is about your physical surroundings - your home, workplace, and the spaces where you spend time. Just like a plant needs good soil to grow, you need supportive surroundings to thrive. When your environment is organized and comfortable, it becomes easier to focus, relax, and feel at peace.",
        biological: "Your biological layer covers your physical health - sleep, nutrition, exercise, and how your body feels. Think of your body as the vehicle that carries you through life. When you take care of it with good food, rest, and movement, everything else in life becomes easier to handle.",
        internal: "Your internal layer is about your thoughts, emotions, and inner world. It's like having an internal weather system - sometimes sunny, sometimes stormy. By understanding your patterns and practicing self-awareness, you can learn to navigate your inner landscape with more ease.",
        cultural: "Your cultural layer connects you to your traditions, values, and heritage. It's like the roots of a tree - invisible but essential for stability. Understanding where you come from helps you know where you're going and gives meaning to your daily choices.",
        social: "Your social layer is about your relationships and connections with others. Humans are social beings - we need meaningful connections like we need food and water. Strong relationships provide support, joy, and a sense of belonging.",
        conscious: "Your conscious layer is about awareness, mindfulness, and being present. It's like having a clear window versus a foggy one - when you're more conscious, you see life more clearly and make better decisions.",
        existential: "Your existential layer deals with life's big questions - purpose, meaning, and what matters most to you. It's like having a compass that guides your journey. When you understand your deeper purpose, daily challenges feel more manageable."
      };

      insight = {
        title: `Focus on Your ${randomLayer.charAt(0).toUpperCase() + randomLayer.slice(1)} Today`,
        content: `Today is a great opportunity to work on your ${randomLayer} layer. Take a moment to reflect on how this area of your life is developing and what small step you can take to improve it.`,
        deepExplanation: layerExplanations[randomLayer] || "This area of your life deserves attention today. Small improvements compound over time into significant positive changes.",
        whyItMatters: "By focusing on this area today, you're investing in your overall wellbeing and building a stronger foundation for all other aspects of your life.",
        actionItems: [
          `Spend 10 minutes reflecting on your ${randomLayer} layer`,
          'Write down one thing you are grateful for',
          'Take one small action toward your goals'
        ]
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const insightId = uuidv4();

    await db.insert(dailyInsights).values({
      id: insightId,
      userId: user_id,
      insightDate: today,
      title: insight.title,
      content: insight.content,
      focusLayer: randomLayer,
      actionItems: insight.actionItems,
      isRead: false,
    });

    const today2 = new Date();
    const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
    let newStreak = profile.currentStreak || 0;
    
    if (lastActive) {
      const diff = Math.floor((today2.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        newStreak += 1;
      } else if (diff > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await db.update(profiles)
      .set({
        lastActiveDate: today,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, profile.longestStreak || 0),
        totalXp: (profile.totalXp || 0) + 10,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user_id));

    return NextResponse.json({
      insight: {
        id: insightId,
        title: insight.title,
        content: insight.content,
        deepExplanation: insight.deepExplanation || '',
        whyItMatters: insight.whyItMatters || '',
        focusLayer: randomLayer,
        actionItems: insight.actionItems,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      streak: newStreak,
    });
  } catch (err: any) {
    console.error('Generate insight error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
