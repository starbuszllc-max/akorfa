import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {posts, userEvents, profiles} from '@akorfa/shared';
import {calculateAkorfaScore} from '@akorfa/shared';
import {eq, desc, sql, and} from 'drizzle-orm';
import {createClient} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // Normalize mediaUrls and mediaTypes to ensure they are proper arrays
    const normalizedPosts = allPosts.map(post => {
      let mediaUrls: string[] = [];
      let mediaTypes: string[] = [];
      
      // Normalize mediaUrls
      if (post.mediaUrls) {
        if (Array.isArray(post.mediaUrls)) {
          mediaUrls = post.mediaUrls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
        } else if (typeof post.mediaUrls === 'string') {
          try {
            const parsed = JSON.parse(post.mediaUrls);
            if (Array.isArray(parsed)) {
              mediaUrls = parsed.filter((u: any): u is string => typeof u === 'string' && u.trim().length > 0);
            }
          } catch {
            if (post.mediaUrls.startsWith('http')) {
              mediaUrls = [post.mediaUrls];
            }
          }
        } else if (typeof post.mediaUrls === 'object') {
          const values = Object.values(post.mediaUrls);
          mediaUrls = values.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
        }
      }
      
      // Normalize mediaTypes
      if (post.mediaTypes) {
        if (Array.isArray(post.mediaTypes)) {
          mediaTypes = post.mediaTypes.filter((t): t is string => typeof t === 'string');
        } else if (typeof post.mediaTypes === 'string') {
          try {
            const parsed = JSON.parse(post.mediaTypes);
            if (Array.isArray(parsed)) {
              mediaTypes = parsed.filter((t: any): t is string => typeof t === 'string');
            }
          } catch {
            mediaTypes = [post.mediaTypes];
          }
        } else if (typeof post.mediaTypes === 'object') {
          const values = Object.values(post.mediaTypes);
          mediaTypes = values.filter((t): t is string => typeof t === 'string');
        }
      }
      
      return {
        ...post,
        mediaUrls,
        mediaTypes
      };
    });

    const countQuery = whereClause
      ? db.select({ count: sql<number>`count(*)::int` }).from(posts).where(whereClause)
      : db.select({ count: sql<number>`count(*)::int` }).from(posts);
    
    const totalCount = await countQuery;

    return NextResponse.json({
      posts: normalizedPosts,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        hasMore: normalizedPosts.length === limit
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
    if (!supabase) {
      return NextResponse.json({error: 'Service configuration error'}, {status: 503});
    }
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

    const mediaUrls = body.mediaUrls ?? [];
    const mediaTypes = body.mediaTypes ?? [];

    const existingPostsCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.userId, user.id));
    const isFirstPost = (existingPostsCount[0]?.count || 0) === 0;

    const [newPost] = await db.insert(posts).values({
      userId: user.id,
      content: content,
      layer: layer,
      mediaUrls: mediaUrls,
      mediaTypes: mediaTypes
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

    return NextResponse.json({post: newPost, isFirstPost});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
