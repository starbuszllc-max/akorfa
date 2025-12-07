import {NextResponse} from 'next/server';
import {supabaseAdmin} from '../../../lib/supabaseClient';
import {calculateAkorfaScore} from '@akorfa/shared/dist/scoring';

export async function POST(req: Request){
  try{
    const body = await req.json();
    const post_id = body.post_id;
    const reaction_type = body.reaction_type ?? 'like';
    const user_id = body.user_id ?? null;

    if(!post_id || !user_id) return NextResponse.json({error: 'post_id and user_id required'},{status:400});

    // Upsert a reaction (if exists do nothing)
    const {data, error} = await supabaseAdmin.from('reactions').insert([{post_id, user_id, reaction_type}]).select('*');
    if(error) {
      // Could be unique constraint; return 409
      console.error(error);
      return NextResponse.json({error: error.message},{status:500});
    }

    // increment like_count on post (simplest approach)
    await supabaseAdmin.rpc('increment_post_like_count', {p_post_id: post_id}).catch(()=>{});

    // insert user_event for reaction
    await supabaseAdmin.from('user_events').insert([{user_id, event_type: 'reaction_given', points_earned: 1, metadata: {post_id}}]);

    // compute delta and atomically increment user score via RPC
    const delta = calculateAkorfaScore({reactionGiven:1});
    await supabaseAdmin.rpc('increment_user_score', {p_user_id: user_id, p_delta: delta});

    return NextResponse.json({ok: true});
  }catch(err:any){
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)},{status:500});
  }
}
