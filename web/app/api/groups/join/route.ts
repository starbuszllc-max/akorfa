import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { groups, groupMembers } from '@akorfa/shared';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { user_id, group_id } = await req.json();

    if (!user_id || !group_id) {
      return NextResponse.json({ error: 'user_id and group_id required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.userId, user_id),
        eq(groupMembers.groupId, group_id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already a member' });
    }

    await db.insert(groupMembers).values({
      groupId: group_id,
      userId: user_id,
      role: 'member',
    });

    await db.update(groups)
      .set({ memberCount: sql`COALESCE(${groups.memberCount}, 0) + 1` })
      .where(eq(groups.id, group_id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Join group error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
