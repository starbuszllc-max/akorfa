import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { posts } from '@akorfa/shared';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const layerStats = await db
      .select({
        layer: posts.layer,
        count: sql<number>`count(*)::int`
      })
      .from(posts)
      .groupBy(posts.layer)
      .orderBy(sql`count(*) desc`)
      .limit(7);

    return NextResponse.json({ 
      layers: layerStats.map(stat => ({
        name: stat.layer,
        count: stat.count
      }))
    });
  } catch (err: any) {
    console.error('Error fetching layer stats:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
