import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {profiles} from '@akorfa/shared';
import {eq} from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {user_id, username} = body;

    if (!user_id) {
      return NextResponse.json({error: 'user_id is required'}, {status: 400});
    }

    const existing = await db.select().from(profiles).where(eq(profiles.id, user_id)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({profile: existing[0]});
    }

    const displayName = username || `User_${user_id.slice(0, 8)}`;
    
    const [newProfile] = await db.insert(profiles).values({
      id: user_id,
      username: displayName
    }).returning();

    return NextResponse.json({profile: newProfile});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({error: 'user_id query param required'}, {status: 400});
    }

    const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    
    if (result.length === 0) {
      return NextResponse.json({profile: null});
    }

    return NextResponse.json({profile: result[0]});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { user_id, avatar_url, cover_url, full_name, bio, username } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (avatar_url !== undefined) updateData.avatarUrl = avatar_url;
    if (cover_url !== undefined) updateData.coverUrl = cover_url;
    if (full_name !== undefined) updateData.fullName = full_name;
    if (bio !== undefined) updateData.bio = bio;
    if (username !== undefined) updateData.username = username;

    const [updated] = await db.update(profiles)
      .set(updateData)
      .where(eq(profiles.id, user_id))
      .returning();

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
