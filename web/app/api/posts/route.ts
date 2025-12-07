import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {posts, userEvents, profiles} from '@akorfa/shared/src/schema';
import {calculateAkorfaScore} from '@akorfa/shared/dist/scoring';
import {eq, desc, sql} from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const layer = searchParams.get('layer');
    
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 50);
    const offset = (page - 1) * limit;

    const baseQuery = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        layer: posts.layer,
        postType: posts.postType,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        profiles: {
          username: profiles.username,
          avatarUrl: profiles.avatarUrl
        }
      })
      .from(posts)
      .leftJoin(profiles, eq(posts.userId, profiles.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const allPosts = layer 
      ? await baseQuery.where(eq(posts.layer, layer))
      : await baseQuery;

    const countQuery = layer
      ? db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.layer, layer))
      : db.select({ count: sql<number>`count(*)::int` }).from(posts);
    
    const totalCount = await countQuery;

    return NextResponse.json({
      posts: allPosts,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        hasMore: allPosts.length === limit
      }
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body.content ?? '';
    const layer = body.layer ?? 'social';
    const user_id = body.user_id ?? null;

    const [newPost] = await db.insert(posts).values({
      userId: user_id,
      content: content,
      layer: layer
    }).returning();

    if (user_id) {
      await db.insert(userEvents).values({
        userId: user_id,
        eventType: 'post_created',
        pointsEarned: 5,
        metadata: {post_id: newPost.id}
      });

      const scoreDelta = calculateAkorfaScore({postsCreated: 1});
      await db.update(profiles)
        .set({
          akorfaScore: sql`COALESCE(${profiles.akorfaScore}, 0) + ${scoreDelta}`,
          updatedAt: new Date()
        })
        .where(eq(profiles.id, user_id));
    }

    return NextResponse.json({post: newPost});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
