import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savedRoutines, routineChallenges } from '@akorfa/shared';
import { eq, desc } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ routines: [] });
    }

    const routines = await db
      .select()
      .from(savedRoutines)
      .where(eq(savedRoutines.userId, userId))
      .orderBy(desc(savedRoutines.createdAt));

    const routinesWithChallenges = await Promise.all(
      routines.map(async (routine) => {
        const challenges = await db
          .select()
          .from(routineChallenges)
          .where(eq(routineChallenges.routineId, routine.id));
        
        return {
          ...routine,
          challenges
        };
      })
    );

    return NextResponse.json({ routines: routinesWithChallenges });
  } catch (error) {
    console.error('Routines fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, description, challengeIds, targetLayers, frequency } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Routine name required' }, { status: 400 });
    }

    const [newRoutine] = await db
      .insert(savedRoutines)
      .values({
        userId,
        name,
        description: description || null,
        targetLayers: targetLayers || [],
        frequency: frequency || 'daily',
        isActive: true
      })
      .returning();

    if (challengeIds && Array.isArray(challengeIds) && challengeIds.length > 0) {
      await db.insert(routineChallenges).values(
        challengeIds.map((challengeId: string, index: number) => ({
          routineId: newRoutine.id,
          challengeId,
          order: index
        }))
      );
    }

    return NextResponse.json({ routine: newRoutine });
  } catch (error) {
    console.error('Routine creation error:', error);
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const routineId = searchParams.get('routineId');
    const userId = searchParams.get('userId');

    if (!routineId || !UUID_REGEX.test(routineId)) {
      return NextResponse.json({ error: 'Valid routineId required' }, { status: 400 });
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    await db
      .delete(routineChallenges)
      .where(eq(routineChallenges.routineId, routineId));

    await db
      .delete(savedRoutines)
      .where(eq(savedRoutines.id, routineId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Routine deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
