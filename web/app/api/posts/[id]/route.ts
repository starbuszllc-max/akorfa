import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts, profiles } from '@akorfa/shared';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { user_id, content, layer } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const [existingPost] = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId));

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.userId !== user_id) {
      return NextResponse.json({ error: 'Not authorized to edit this post' }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (content !== undefined) updateData.content = content;
    if (layer !== undefined) updateData.layer = layer;

    const [updatedPost] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .returning();

    return NextResponse.json({ post: updatedPost });
  } catch (err: any) {
    console.error('Error updating post:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const [existingPost] = await db
      .select({ userId: posts.userId })
      .from(posts)
      .where(eq(posts.id, postId));

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.userId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting post:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
