import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountabilityPods, podMembers, profiles } from '@akorfa/shared';
import { eq, desc, sql, and } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const pods = await db
      .select({
        id: accountabilityPods.id,
        name: accountabilityPods.name,
        description: accountabilityPods.description,
        createdBy: accountabilityPods.createdBy,
        maxMembers: accountabilityPods.maxMembers,
        focusLayer: accountabilityPods.focusLayer,
        isPublic: accountabilityPods.isPublic,
        createdAt: accountabilityPods.createdAt,
        memberCount: sql<number>`(SELECT COUNT(*) FROM pod_members WHERE pod_id = ${accountabilityPods.id})`.as('memberCount')
      })
      .from(accountabilityPods)
      .where(eq(accountabilityPods.isPublic, true))
      .orderBy(desc(accountabilityPods.createdAt));

    let userPodIds: string[] = [];
    if (userId && UUID_REGEX.test(userId)) {
      const userMemberships = await db
        .select({ podId: podMembers.podId })
        .from(podMembers)
        .where(eq(podMembers.userId, userId));
      userPodIds = userMemberships.map(m => m.podId);
    }

    const podsWithMemberInfo = await Promise.all(
      pods.map(async (pod) => {
        const members = await db
          .select({
            id: podMembers.id,
            role: podMembers.role,
            joinedAt: podMembers.joinedAt,
            user: {
              id: profiles.id,
              username: profiles.username,
              fullName: profiles.fullName,
              avatarUrl: profiles.avatarUrl
            }
          })
          .from(podMembers)
          .leftJoin(profiles, eq(podMembers.userId, profiles.id))
          .where(eq(podMembers.podId, pod.id));

        return {
          ...pod,
          members,
          isMember: userPodIds.includes(pod.id)
        };
      })
    );

    return NextResponse.json({ pods: podsWithMemberInfo });
  } catch (error) {
    console.error('Pods fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch pods' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, description, focusLayer, maxMembers } = body;

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Pod name required' }, { status: 400 });
    }

    const [newPod] = await db
      .insert(accountabilityPods)
      .values({
        name,
        description: description || null,
        createdBy: userId,
        focusLayer: focusLayer || null,
        maxMembers: maxMembers || 5,
        isPublic: true
      })
      .returning();

    await db.insert(podMembers).values({
      podId: newPod.id,
      userId,
      role: 'leader'
    });

    return NextResponse.json({ pod: newPod });
  } catch (error) {
    console.error('Pod creation error:', error);
    return NextResponse.json({ error: 'Failed to create pod' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { podId, userId, action } = body;

    if (!podId || !UUID_REGEX.test(podId)) {
      return NextResponse.json({ error: 'Valid podId required' }, { status: 400 });
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    if (action === 'join') {
      const pod = await db
        .select()
        .from(accountabilityPods)
        .where(eq(accountabilityPods.id, podId))
        .limit(1);

      if (!pod.length) {
        return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
      }

      const currentMembers = await db
        .select()
        .from(podMembers)
        .where(eq(podMembers.podId, podId));

      if (currentMembers.length >= (pod[0].maxMembers || 5)) {
        return NextResponse.json({ error: 'Pod is full' }, { status: 400 });
      }

      const existingMember = currentMembers.find(m => m.userId === userId);
      if (existingMember) {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      }

      await db.insert(podMembers).values({
        podId,
        userId,
        role: 'member'
      });

      return NextResponse.json({ success: true, message: 'Joined pod' });
    }

    if (action === 'leave') {
      await db
        .delete(podMembers)
        .where(and(
          eq(podMembers.podId, podId),
          eq(podMembers.userId, userId)
        ));

      return NextResponse.json({ success: true, message: 'Left pod' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Pod action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const podId = searchParams.get('podId');
    const userId = searchParams.get('userId');

    if (!podId || !UUID_REGEX.test(podId)) {
      return NextResponse.json({ error: 'Valid podId required' }, { status: 400 });
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    const pod = await db
      .select()
      .from(accountabilityPods)
      .where(eq(accountabilityPods.id, podId))
      .limit(1);

    if (!pod.length || pod[0].createdBy !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this pod' }, { status: 403 });
    }

    await db.delete(podMembers).where(eq(podMembers.podId, podId));
    await db.delete(accountabilityPods).where(eq(accountabilityPods.id, podId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pod deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete pod' }, { status: 500 });
  }
}
