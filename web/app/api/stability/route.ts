import {NextResponse} from 'next/server';
import {supabaseAdmin} from '../../../lib/supabaseClient';
import {calculateStability} from '@akorfa/shared/dist/scoring';

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

    // Persist to assessments as a special stability record for now, include user_id if provided
    const user_id = body.user_id ?? null;
    const {data, error} = await supabaseAdmin
      .from('assessments')
      .insert([
        {
          user_id: user_id,
          layer_scores: metrics,
          overall_score: stability,
          insights: JSON.stringify({note: 'stability-calc'})
        }
      ])
      .select('*')
      .single();

    if (error) return NextResponse.json({error: error.message}, {status: 500});

    return NextResponse.json({id: data.id, stability});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
