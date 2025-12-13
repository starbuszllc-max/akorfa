import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communityBoards, communityBoardMembers } from '@akorfa/shared';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const city = url.searchParams.get('city');
    const country = url.searchParams.get('country');
    const boardId = url.searchParams.get('board_id');

    if (boardId) {
      const [board] = await db.select()
        .from(communityBoards)
        .where(eq(communityBoards.id, boardId))
        .limit(1);

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
      }

      let isMember = false;
      if (userId) {
        const [membership] = await db.select()
          .from(communityBoardMembers)
          .where(and(
            eq(communityBoardMembers.boardId, boardId),
            eq(communityBoardMembers.userId, userId)
          ))
          .limit(1);
        isMember = !!membership;
      }

      return NextResponse.json({ board, isMember });
    }

    let boards;
    if (city) {
      boards = await db.select()
        .from(communityBoards)
        .where(eq(communityBoards.city, city))
        .orderBy(desc(communityBoards.memberCount))
        .limit(20);
    } else if (country) {
      boards = await db.select()
        .from(communityBoards)
        .where(eq(communityBoards.country, country))
        .orderBy(desc(communityBoards.memberCount))
        .limit(20);
    } else {
      boards = await db.select()
        .from(communityBoards)
        .orderBy(desc(communityBoards.memberCount))
        .limit(50);
    }

    let userBoardIds: string[] = [];
    if (userId) {
      const memberships = await db.select({ boardId: communityBoardMembers.boardId })
        .from(communityBoardMembers)
        .where(eq(communityBoardMembers.userId, userId));
      userBoardIds = memberships.map(m => m.boardId!);
    }

    const boardsWithMembership = boards.map(b => ({
      ...b,
      isMember: userBoardIds.includes(b.id)
    }));

    return NextResponse.json({ boards: boardsWithMembership });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, board_id, action, name, description, city, region, country } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    if (action === 'join' && board_id) {
      const existing = await db.select()
        .from(communityBoardMembers)
        .where(and(
          eq(communityBoardMembers.boardId, board_id),
          eq(communityBoardMembers.userId, user_id)
        ))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      }

      const [membership] = await db.insert(communityBoardMembers).values({
        boardId: board_id,
        userId: user_id,
        role: 'member'
      }).returning();

      await db.update(communityBoards)
        .set({ memberCount: sql`COALESCE(${communityBoards.memberCount}, 0) + 1` })
        .where(eq(communityBoards.id, board_id));

      return NextResponse.json({ membership });
    }

    if (action === 'leave' && board_id) {
      await db.delete(communityBoardMembers)
        .where(and(
          eq(communityBoardMembers.boardId, board_id),
          eq(communityBoardMembers.userId, user_id)
        ));

      await db.update(communityBoards)
        .set({ memberCount: sql`GREATEST(COALESCE(${communityBoards.memberCount}, 0) - 1, 0)` })
        .where(eq(communityBoards.id, board_id));

      return NextResponse.json({ success: true });
    }

    if (action === 'create' && name) {
      const [board] = await db.insert(communityBoards).values({
        name,
        description: description || null,
        city: city || null,
        region: region || null,
        country: country || null,
        memberCount: 1
      }).returning();

      await db.insert(communityBoardMembers).values({
        boardId: board.id,
        userId: user_id,
        role: 'admin'
      });

      return NextResponse.json({ board });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
