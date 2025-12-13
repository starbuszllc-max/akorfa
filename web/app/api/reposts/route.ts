import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { posts, profiles } from '@akorfa/shared';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { originalPostId, userId } = body;

    if (!originalPostId || !userId) {
      return NextResponse.json({ error: 'originalPostId and userId required' }, { status: 400 });
    }

    // Get the original post
    const [originalPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, originalPostId));

    if (!originalPost) {
      return NextResponse.json({ error: 'Original post not found' }, { status: 404 });
    }

    // Create repost
    const [repost] = await db.insert(posts).values({
      userId: userId,
      content: originalPost.content,
      layer: originalPost.layer,
      mediaUrls: originalPost.mediaUrls,
      mediaTypes: originalPost.mediaTypes,
      sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ak-fa-web-one.vercel.app'}/posts/${originalPostId}`,
      sourceName: 'repost'
    }).returning();

    return NextResponse.json({ repost });
  } catch (err: any) {
    console.error('Error creating repost:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
