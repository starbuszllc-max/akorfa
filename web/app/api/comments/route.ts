import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {comments, posts, profiles, userEvents} from '@akorfa/shared';
import {calculateAkorfaScore} from '@akorfa/shared/src/scoring';
import {eq, desc, sql} from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({error: 'post_id query param required'}, {status: 400});
    }

    const allComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        isHelpful: comments.isHelpful,
        createdAt: comments.createdAt,
        profiles: {
          username: profiles.username,
          avatarUrl: profiles.avatarUrl
        }
      })
      .from(comments)
      .leftJoin(profiles, eq(comments.userId, profiles.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({comments: allComments});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {post_id, user_id, content, parent_id} = body;

    if (!post_id || !content) {
      return NextResponse.json({error: 'post_id and content are required'}, {status: 400});
    }

    const insertData: any = {
      postId: post_id,
      userId: user_id || null,
      content: content
    };
    
    if (parent_id) {
      insertData.parentId = parent_id;
    }

    const [newComment] = await db.insert(comments).values(insertData).returning();

    await db.update(posts)
      .set({
        commentCount: sql`COALESCE(${posts.commentCount}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, post_id));

    if (user_id) {
      await db.insert(userEvents).values({
        userId: user_id,
        eventType: 'comment_created',
        pointsEarned: 3,
        metadata: {post_id, comment_id: newComment.id}
      });

      const delta = calculateAkorfaScore({usersHelped: 1});
      await db.update(profiles)
        .set({
          akorfaScore: sql`COALESCE(${profiles.akorfaScore}, 0) + ${delta}`,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, user_id));
    }

    return NextResponse.json({comment: newComment});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
