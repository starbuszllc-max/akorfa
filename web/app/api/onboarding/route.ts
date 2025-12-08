import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { profiles } from '@akorfa/shared/src/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { name, goals, focusLayers } = await req.json();

    const userId = uuidv4();
    const username = `user_${userId.slice(0, 8)}`;

    await db.insert(profiles).values({
      id: userId,
      username,
      fullName: name,
      goals: goals,
      metadata: { focusLayers, onboardingDate: new Date().toISOString() },
      onboardingCompleted: true,
      currentStreak: 1,
      totalXp: 50,
      level: 1,
    });

    return NextResponse.json({ userId, success: true });
  } catch (err: any) {
    console.error('Onboarding error:', err);
    const errorMessage = err?.message || String(err);
    const errorStack = err?.stack || '';
    const errorCode = err?.code || '';
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: errorStack,
      hint: 'Check DATABASE_URL environment variable and database schema'
    }, { status: 500 });
  }
}
