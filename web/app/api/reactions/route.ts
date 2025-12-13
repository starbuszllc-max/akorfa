import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {reactions, posts, userEvents, profiles} from '@akorfa/shared';
import {calculateAkorfaScore} from '@akorfa/shared/src/scoring';
import {eq, sql} from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const post_id = body.post_id;
    const reaction_type = body.reaction_type ?? 'like';
    const user_id = body.user_id ?? null;

    if (!post_id || !user_id) {
      return NextResponse.json({error: 'post_id and user_id required'}, {status: 400});
    }

    const [newReaction] = await db.insert(reactions).values({
      postId: post_id,
      userId: user_id,
      reactionType: reaction_type
    }).returning();

    await db.update(posts)
      .set({
        likeCount: sql`COALESCE(${posts.likeCount}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, post_id));

    await db.insert(userEvents).values({
      userId: user_id,
      eventType: 'reaction_given',
      pointsEarned: 1,
      metadata: {post_id}
    });

    const delta = calculateAkorfaScore({usersHelped: 1});
    await db.update(profiles)
      .set({
        akorfaScore: sql`COALESCE(${profiles.akorfaScore}, 0) + ${delta}`,
        updatedAt: new Date()
      })
      .where(eq(profiles.id, user_id));

    return NextResponse.json({ok: true});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
