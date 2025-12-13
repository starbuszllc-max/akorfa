import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, profiles } from '@akorfa/shared';
import { eq, desc, gt, and, sql } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const now = new Date();

    const result = await db.select({
      id: stories.id,
      userId: stories.userId,
      content: stories.content,
      mediaUrl: stories.mediaUrl,
      mediaType: stories.mediaType,
      layer: stories.layer,
      viewCount: stories.viewCount,
      expiresAt: stories.expiresAt,
      createdAt: stories.createdAt,
      user: {
        id: profiles.id,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
        fullName: profiles.fullName
      }
    })
    .from(stories)
    .innerJoin(profiles, eq(stories.userId, profiles.id))
    .where(
      userId && UUID_REGEX.test(userId)
        ? and(eq(stories.userId, userId), gt(stories.expiresAt, now))
        : gt(stories.expiresAt, now)
    )
    .orderBy(desc(stories.createdAt))
    .limit(100);

    const groupedStories = result.reduce((acc, story) => {
      const uId = story.userId as string;
      if (!acc[uId]) {
        acc[uId] = {
          user: story.user,
          stories: []
        };
      }
      acc[uId].stories.push({
        id: story.id,
        content: story.content,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        layer: story.layer,
        viewCount: story.viewCount,
        expiresAt: story.expiresAt,
        createdAt: story.createdAt
      });
      return acc;
    }, {} as Record<string, { user: any; stories: any[] }>);

    const storyGroups = Object.values(groupedStories);

    return NextResponse.json({ stories: storyGroups });
  } catch (error) {
    console.error('Stories fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, content, mediaUrl, mediaType, layer } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (!mediaUrl && !content) {
      return NextResponse.json({ error: 'Content or media required' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const [story] = await db.insert(stories).values({
      userId,
      content: content || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      layer: layer || null,
      expiresAt
    }).returning();

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Story create error:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { storyId, action } = body;

    if (!storyId || !UUID_REGEX.test(storyId)) {
      return NextResponse.json({ error: 'Valid storyId required' }, { status: 400 });
    }

    if (action === 'view') {
      await db.update(stories)
        .set({ viewCount: sql`${stories.viewCount} + 1` })
        .where(eq(stories.id, storyId));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Story update error:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');
    const userId = searchParams.get('userId');

    if (!storyId || !UUID_REGEX.test(storyId)) {
      return NextResponse.json({ error: 'Valid storyId required' }, { status: 400 });
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    await db.delete(stories)
      .where(and(eq(stories.id, storyId), eq(stories.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Story delete error:', error);
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
  }
}
