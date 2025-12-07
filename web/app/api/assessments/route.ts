import {NextResponse} from 'next/server';
import {supabaseAdmin} from '../../lib/supabaseClient';
import {calculateAkorfaScore} from '@akorfa/shared/dist/scoring';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const layer_scores = body.layer_scores ?? {};

    // Convert layer scores into activity-like input for scoring engine.
    // For MVP, compute a simple overall score: average layers * 10
    const layerValues = Object.values(layer_scores).map((v: any) => Number(v) || 0);
    const avg = layerValues.length ? layerValues.reduce((a, b) => a + b, 0) / layerValues.length : 0;

    // Build a minimal activity input: treat assessment completion and improvement
    const activityInput = {
      assessmentCompletions: 1,
      scoreImprovement: 0,
      consistencyStreak: 0
    };

    const akorfaScore = calculateAkorfaScore(activityInput as any);
    const overall_score = Number((akorfaScore * (avg / 10)).toFixed(2));

    // Persist to Supabase (assessments table), include user_id if provided
    const user_id = body.user_id ?? null;
    const {data, error} = await supabaseAdmin
      .from('assessments')
      .insert([
        {
          user_id: user_id,
          layer_scores: layer_scores,
          overall_score: overall_score,
          insights: null
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert error', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({id: data.id, overall_score});
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)}, {status: 500});
  }
}
