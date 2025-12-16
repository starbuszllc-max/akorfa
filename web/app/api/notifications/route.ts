import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications, profiles } from '@akorfa/shared';
import { eq, desc, and, inArray, count } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const whereCondition = unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    const result = await db.select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      referenceId: notifications.referenceId,
      referenceType: notifications.referenceType,
      actorId: notifications.actorId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(whereCondition)
    .orderBy(desc(notifications.createdAt))
    .limit(50);

    const actorIds = [...new Set(result.filter(n => n.actorId).map(n => n.actorId as string))];
    const actors: Record<string, any> = {};
    
    if (actorIds.length > 0) {
      const actorProfiles = await db.select({
        id: profiles.id,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl
      })
      .from(profiles)
      .where(inArray(profiles.id, actorIds));
      
      actorProfiles.forEach(a => {
        actors[a.id] = a;
      });
    }

    const notificationsWithActors = result.map(n => ({
      ...n,
      actor: n.actorId ? actors[n.actorId] : null
    }));

    const [unreadCountResult] = await db.select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return NextResponse.json({
      notifications: notificationsWithActors,
      unreadCount: unreadCountResult?.count || 0
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, title, message, referenceId, referenceType, actorId } = body;

    if (!userId || !type || !title) {
      return NextResponse.json({ error: 'userId, type, and title required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid UUID userId required' }, { status: 400 });
    }

    const [notification] = await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      referenceId,
      referenceType,
      actorId
    }).returning();

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, notificationId, markAllRead } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid UUID userId required' }, { status: 400 });
    }

    if (markAllRead) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } else if (notificationId) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
