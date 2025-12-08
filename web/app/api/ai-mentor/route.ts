import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { aiMentorSessions } from '@akorfa/shared/src/schema';
import { eq, desc } from 'drizzle-orm';
import { getOpenAI, hasOpenAIKey } from '../../../lib/openai';

const SYSTEM_PROMPT = `You are Akorfa, an AI mentor specializing in teaching about human systems, social dynamics, and personal growth. You guide users through understanding:

1. Human Behavior OS - emotions, cognitive biases, perception, decision-making
2. Social Systems OS - community trust, local cohesion, governance logic, cooperation
3. Leadership OS - influence, power dynamics, ethical leadership, vision-setting
4. Stability Equation - S = R(L+G) / (|L-G| + C) where:
   - S = Stability
   - R = Resilience factor
   - L = Local OS strength
   - G = Global OS alignment
   - C = Conflict intensity

Your teaching style is:
- Socratic - ask thought-provoking questions
- Practical - give real-world examples
- Encouraging - celebrate small insights
- Progressive - build complexity gradually

Keep responses concise but insightful. Use analogies and stories when helpful.`;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const sessionId = url.searchParams.get('session_id');

    if (sessionId) {
      const [session] = await db.select()
        .from(aiMentorSessions)
        .where(eq(aiMentorSessions.id, sessionId))
        .limit(1);
      return NextResponse.json({ session });
    }

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const sessions = await db.select()
      .from(aiMentorSessions)
      .where(eq(aiMentorSessions.userId, userId))
      .orderBy(desc(aiMentorSessions.updatedAt))
      .limit(20);

    return NextResponse.json({ sessions });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, session_id, message, topic, layer } = body;

    if (!user_id || !message) {
      return NextResponse.json({ error: 'user_id and message required' }, { status: 400 });
    }

    let session;
    let messages: any[] = [];

    if (session_id) {
      const [existing] = await db.select()
        .from(aiMentorSessions)
        .where(eq(aiMentorSessions.id, session_id))
        .limit(1);
      
      if (existing) {
        session = existing;
        messages = (existing.messages as any[]) || [];
      }
    }

    messages.push({ role: 'user', content: message });

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ];

    if (!hasOpenAIKey()) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        response: 'I apologize, but I cannot respond right now as the AI service is not configured. Please ensure the OpenAI API key is set up.'
      }, { status: 503 });
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
    messages.push({ role: 'assistant', content: aiResponse });

    if (session) {
      const [updated] = await db.update(aiMentorSessions)
        .set({
          messages: messages,
          updatedAt: new Date()
        })
        .where(eq(aiMentorSessions.id, session.id))
        .returning();

      return NextResponse.json({ session: updated, response: aiResponse });
    }

    const [newSession] = await db.insert(aiMentorSessions).values({
      userId: user_id,
      topic: topic || 'General Learning',
      layer: layer || null,
      messages: messages
    }).returning();

    return NextResponse.json({ session: newSession, response: aiResponse });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
