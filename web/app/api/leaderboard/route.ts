import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { profiles } from '@akorfa/shared';
import { desc, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'xp';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    let orderColumn;
    switch (type) {
      case 'streak':
        orderColumn = profiles.currentStreak;
        break;
      case 'score':
        orderColumn = profiles.akorfaScore;
        break;
      case 'xp':
      default:
        orderColumn = profiles.totalXp;
    }

    const leaders = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        akorfaScore: profiles.akorfaScore,
        totalXp: profiles.totalXp,
        level: profiles.level,
        currentStreak: profiles.currentStreak,
      })
      .from(profiles)
      .orderBy(desc(orderColumn))
      .limit(limit);

    const rankedLeaders = leaders.map((leader, index) => ({
      rank: index + 1,
      ...leader,
      akorfaScore: parseFloat(String(leader.akorfaScore)) || 0,
    }));

    return NextResponse.json({ leaderboard: rankedLeaders, type });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
