import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { profiles } from '@akorfa/shared';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId, name, goals, focusLayers } = await req.json();

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required. Please sign up first.',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    const username = `user_${userId.slice(0, 8)}`;

    const existingProfile = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    
    if (existingProfile.length > 0) {
      await db.update(profiles)
        .set({
          fullName: name,
          goals: goals,
          metadata: { focusLayers, onboardingDate: new Date().toISOString() },
          onboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));
    } else {
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
    }

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
