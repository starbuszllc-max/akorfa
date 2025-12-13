import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { assessments } from '@akorfa/shared';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const userAssessments = await db
      .select({
        overallScore: assessments.overallScore,
        layerScores: assessments.layerScores,
        createdAt: assessments.createdAt,
      })
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt))
      .limit(30);

    const trends = userAssessments.reverse().map((a) => ({
      date: a.createdAt?.toISOString().split('T')[0] || '',
      score: parseFloat(String(a.overallScore)) || 0,
      layerScores: a.layerScores,
    }));

    const layerTrends: Record<string, number[]> = {
      environment: [],
      biological: [],
      internal: [],
      cultural: [],
      social: [],
      conscious: [],
      existential: [],
    };

    for (const a of userAssessments) {
      const scores = a.layerScores as Record<string, number> | null;
      if (scores) {
        for (const layer of Object.keys(layerTrends)) {
          if (scores[layer] !== undefined) {
            layerTrends[layer].push(scores[layer]);
          }
        }
      }
    }

    const layerAverages: Record<string, number> = {};
    for (const [layer, scores] of Object.entries(layerTrends)) {
      if (scores.length > 0) {
        layerAverages[layer] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    let improvement = 0;
    if (trends.length >= 2) {
      improvement = trends[trends.length - 1].score - trends[0].score;
    }

    return NextResponse.json({
      trends,
      layerAverages,
      improvement: Math.round(improvement * 10) / 10,
      totalAssessments: userAssessments.length,
    });
  } catch (err: any) {
    console.error('Trends fetch error:', err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
