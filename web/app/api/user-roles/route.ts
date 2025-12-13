import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { userRoles } from '@akorfa/shared';
import { eq, and } from 'drizzle-orm';

const AVAILABLE_ROLES = [
  { id: 'student', name: 'Student', icon: 'graduation-cap', description: 'Learning and growing' },
  { id: 'creator', name: 'Creator', icon: 'sparkles', description: 'Making content and art' },
  { id: 'activist', name: 'Activist', icon: 'megaphone', description: 'Driving social change' },
  { id: 'historian', name: 'Historian', icon: 'book-open', description: 'Preserving knowledge' },
  { id: 'engineer', name: 'Engineer', icon: 'wrench', description: 'Building solutions' },
  { id: 'system-thinker', name: 'System Thinker', icon: 'brain', description: 'Understanding complexity' },
  { id: 'learner', name: 'Insight Learner', icon: 'lightbulb', description: 'Exploring human systems' },
  { id: 'leader', name: 'Leader', icon: 'crown', description: 'Guiding communities' },
  { id: 'mentor', name: 'Mentor', icon: 'heart-handshake', description: 'Helping others grow' },
  { id: 'entrepreneur', name: 'Entrepreneur', icon: 'rocket', description: 'Building ventures' }
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ availableRoles: AVAILABLE_ROLES });
    }

    const userRolesList = await db.select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    const selectedRoles = userRolesList.map(r => ({
      ...AVAILABLE_ROLES.find(ar => ar.id === r.role),
      isPrimary: r.isPrimary,
      assignedAt: r.createdAt
    }));

    return NextResponse.json({ 
      availableRoles: AVAILABLE_ROLES,
      userRoles: selectedRoles 
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, role, is_primary } = body;

    if (!user_id || !role) {
      return NextResponse.json({ error: 'user_id and role required' }, { status: 400 });
    }

    if (!AVAILABLE_ROLES.find(r => r.id === role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await db.select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, user_id), eq(userRoles.role, role)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Role already assigned' }, { status: 400 });
    }

    if (is_primary) {
      await db.update(userRoles)
        .set({ isPrimary: false })
        .where(eq(userRoles.userId, user_id));
    }

    const [newRole] = await db.insert(userRoles).values({
      userId: user_id,
      role: role,
      isPrimary: is_primary || false
    }).returning();

    return NextResponse.json({ userRole: newRole });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const role = url.searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json({ error: 'user_id and role required' }, { status: 400 });
    }

    await db.delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
