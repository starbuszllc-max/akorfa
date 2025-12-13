import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { posts, comments, challengeParticipants, assessments, userEvents } from '@akorfa/shared';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id query param required' }, { status: 400 });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const postsByDay = await db
      .select({
        date: sql<string>`DATE(${posts.createdAt})`.as('date'),
        count: sql<number>`COUNT(*)::int`.as('count')
      })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        gte(posts.createdAt, oneYearAgo)
      ))
      .groupBy(sql`DATE(${posts.createdAt})`);

    const commentsByDay = await db
      .select({
        date: sql<string>`DATE(${comments.createdAt})`.as('date'),
        count: sql<number>`COUNT(*)::int`.as('count')
      })
      .from(comments)
      .where(and(
        eq(comments.userId, userId),
        gte(comments.createdAt, oneYearAgo)
      ))
      .groupBy(sql`DATE(${comments.createdAt})`);

    const challengesByDay = await db
      .select({
        date: sql<string>`DATE(${challengeParticipants.joinedAt})`.as('date'),
        count: sql<number>`COUNT(*)::int`.as('count')
      })
      .from(challengeParticipants)
      .where(and(
        eq(challengeParticipants.userId, userId),
        gte(challengeParticipants.joinedAt, oneYearAgo)
      ))
      .groupBy(sql`DATE(${challengeParticipants.joinedAt})`);

    const assessmentsByDay = await db
      .select({
        date: sql<string>`DATE(${assessments.createdAt})`.as('date'),
        count: sql<number>`COUNT(*)::int`.as('count')
      })
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        gte(assessments.createdAt, oneYearAgo)
      ))
      .groupBy(sql`DATE(${assessments.createdAt})`);

    const activityMap: Record<string, number> = {};

    for (const row of postsByDay) {
      const dateStr = row.date;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + row.count;
    }
    for (const row of commentsByDay) {
      const dateStr = row.date;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + row.count;
    }
    for (const row of challengesByDay) {
      const dateStr = row.date;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + row.count;
    }
    for (const row of assessmentsByDay) {
      const dateStr = row.date;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + row.count;
    }

    const activity = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count
    }));

    return NextResponse.json({ activity });
  } catch (err: any) {
    console.error('Activity fetch error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
