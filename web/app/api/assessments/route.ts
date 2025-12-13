import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {assessments} from '@akorfa/shared';
import {calculateAkorfaScore} from '@akorfa/shared/src/scoring';
import {desc} from 'drizzle-orm';

export async function GET() {
  try {
    const allAssessments = await db.select().from(assessments).orderBy(desc(assessments.createdAt)).limit(50);
    return NextResponse.json({assessments: allAssessments});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const layer_scores = body.layer_scores ?? {};

    const layerValues = Object.values(layer_scores).map((v: any) => Number(v) || 0);
    const avg = layerValues.length ? layerValues.reduce((a, b) => a + b, 0) / layerValues.length : 0;

    const activityInput = {
      assessmentCompletions: 1,
      scoreImprovement: 0,
      consistencyStreak: 0
    };

    const akorfaScore = calculateAkorfaScore(activityInput as any);
    const overall_score = Number((akorfaScore * (avg / 10)).toFixed(2));

    const user_id = body.user_id ?? null;
    
    const [newAssessment] = await db.insert(assessments).values({
      userId: user_id,
      layerScores: layer_scores,
      overallScore: overall_score.toString(),
      insights: null
    }).returning();

    return NextResponse.json({id: newAssessment.id, overall_score});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
