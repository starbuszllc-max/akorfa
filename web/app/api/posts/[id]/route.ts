import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { posts, profiles } from '@akorfa/shared';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const [post] = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        layer: posts.layer,
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
      .where(eq(posts.id, postId));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err: any) {
    console.error('Error fetching post:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
