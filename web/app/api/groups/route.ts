import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { groups, groupMembers } from '@akorfa/shared';
import { eq, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    const allGroups = await db
      .select()
      .from(groups)
      .orderBy(desc(groups.memberCount));

    let userGroupIds: string[] = [];
    if (userId) {
      const userMemberships = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, userId));
      userGroupIds = userMemberships.map(m => m.groupId!).filter(Boolean);
    }

    const formattedGroups = allGroups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      layer: g.layer,
      avatarUrl: g.avatarUrl,
      memberCount: g.memberCount || 0,
      isPublic: g.isPublic,
      isMember: userGroupIds.includes(g.id),
    }));

    return NextResponse.json({ groups: formattedGroups });
  } catch (err: any) {
    console.error('Groups fetch error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, layer, is_public, created_by } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const groupId = uuidv4();

    await db.insert(groups).values({
      id: groupId,
      name,
      description,
      layer,
      isPublic: is_public !== false,
      createdBy: created_by,
      memberCount: 1,
    });

    if (created_by) {
      await db.insert(groupMembers).values({
        groupId,
        userId: created_by,
        role: 'admin',
      });
    }

    return NextResponse.json({ id: groupId, success: true });
  } catch (err: any) {
    console.error('Create group error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
