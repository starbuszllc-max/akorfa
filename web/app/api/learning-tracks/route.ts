import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { learningTracks, lessons, userLearningProgress } from '@akorfa/shared';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const trackSlug = url.searchParams.get('slug');

    if (trackSlug) {
      const [track] = await db.select()
        .from(learningTracks)
        .where(eq(learningTracks.slug, trackSlug))
        .limit(1);

      if (!track) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      const trackLessons = await db.select()
        .from(lessons)
        .where(eq(lessons.trackId, track.id))
        .orderBy(asc(lessons.orderIndex));

      let progress = null;
      if (userId) {
        const [userProgress] = await db.select()
          .from(userLearningProgress)
          .where(eq(userLearningProgress.userId, userId))
          .limit(1);
        progress = userProgress;
      }

      return NextResponse.json({ track, lessons: trackLessons, progress });
    }

    const tracks = await db.select()
      .from(learningTracks)
      .where(eq(learningTracks.isActive, true));

    let userProgress: any[] = [];
    if (userId) {
      userProgress = await db.select()
        .from(userLearningProgress)
        .where(eq(userLearningProgress.userId, userId));
    }

    const tracksWithProgress = tracks.map(track => {
      const progress = userProgress.find(p => p.trackId === track.id);
      return {
        ...track,
        userProgress: progress || null
      };
    });

    return NextResponse.json({ tracks: tracksWithProgress });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, track_id, lesson_id, action } = body;

    if (!user_id || !track_id) {
      return NextResponse.json({ error: 'user_id and track_id required' }, { status: 400 });
    }

    const [existing] = await db.select()
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, user_id))
      .limit(1);

    if (action === 'start' && !existing) {
      const [progress] = await db.insert(userLearningProgress).values({
        userId: user_id,
        trackId: track_id,
        lessonId: lesson_id || null,
        status: 'in_progress',
        progress: 0
      }).returning();

      return NextResponse.json({ progress });
    }

    if (action === 'complete_lesson' && existing) {
      const [track] = await db.select()
        .from(learningTracks)
        .where(eq(learningTracks.id, track_id))
        .limit(1);

      const newCompletedLessons = (existing.completedLessons || 0) + 1;
      const totalLessons = track?.totalLessons || 1;
      const newProgress = Math.min(100, Math.round((newCompletedLessons / totalLessons) * 100));

      const [updated] = await db.update(userLearningProgress)
        .set({
          completedLessons: newCompletedLessons,
          progress: newProgress,
          lessonId: lesson_id,
          status: newProgress >= 100 ? 'completed' : 'in_progress',
          completedAt: newProgress >= 100 ? new Date() : null
        })
        .where(eq(userLearningProgress.id, existing.id))
        .returning();

      return NextResponse.json({ progress: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
