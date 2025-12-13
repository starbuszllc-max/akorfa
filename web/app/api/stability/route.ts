import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {assessments} from '@akorfa/shared';
import {calculateStability} from '@akorfa/shared/src/scoring';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const metrics = {
      R: Number(body.R) || 0,
      L: Number(body.L) || 0,
      G: Number(body.G) || 0,
      C: Number(body.C) || 0.1,
      A: Number(body.A) || 0,
      n: Number(body.n) || 1
    };

    const stability = calculateStability(metrics as any);

    const user_id = body.user_id ?? null;
    
    const [newRecord] = await db.insert(assessments).values({
      userId: user_id,
      layerScores: metrics,
      overallScore: stability.toString(),
      insights: JSON.stringify({note: 'stability-calc'})
    }).returning();

    return NextResponse.json({id: newRecord.id, stability});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
