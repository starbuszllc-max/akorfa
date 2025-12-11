import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {posts, userEvents, profiles} from '@akorfa/shared/src/schema';
import {calculateAkorfaScore} from '@akorfa/shared/src/scoring';
import {eq, desc, sql, and} from 'drizzle-orm';
import {createClient} from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '20');
    const layer = searchParams.get('layer');
    const userId = searchParams.get('user_id');
    
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 50);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (layer) conditions.push(eq(posts.layer, layer));
    if (userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      conditions.push(eq(posts.userId, userId));
    }

    const whereClause = conditions.length > 0 
      ? conditions.length === 1 ? conditions[0] : and(...conditions)
      : undefined;

    const baseQuery = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        layer: posts.layer,
        postType: posts.postType,
        mediaUrls: posts.mediaUrls,
        mediaTypes: posts.mediaTypes,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        profiles: {
          username: profiles.username,
          fullName: profiles.fullName,
          avatarUrl: profiles.avatarUrl
        }
      })
      .from(posts)
      .leftJoin(profiles, eq(posts.userId, profiles.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const allPosts = whereClause 
      ? await baseQuery.where(whereClause) 
      : await baseQuery;

    const countQuery = whereClause
      ? db.select({ count: sql<number>`count(*)::int` }).from(posts).where(whereClause)
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({error: 'You must be signed in to post'}, {status: 401});
    }

    const body = await req.json();
    const content = body.content ?? '';
    const layer = body.layer ?? 'social';

    if (!content.trim()) {
      return NextResponse.json({error: 'Post content is required'}, {status: 400});
    }

    const existingProfile = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
    
    if (existingProfile.length === 0) {
      const username = user.user_metadata?.full_name || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      await db.insert(profiles).values({
        id: user.id,
        username: username,
        fullName: user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null
      });
    }

    const [newPost] = await db.insert(posts).values({
      userId: user.id,
      content: content,
      layer: layer
    }).returning();

    await db.insert(userEvents).values({
      userId: user.id,
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
      .where(eq(profiles.id, user.id));

    return NextResponse.json({post: newPost});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
