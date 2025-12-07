import {NextResponse} from 'next/server';
import {supabaseAdmin} from '../../../lib/supabaseClient';
import {calculateAkorfaScore} from '@akorfa/shared/dist/scoring';

export async function POST(req: Request){
  try{
    const body = await req.json();
    const content = body.content ?? '';
    const layer = body.layer ?? 'social';
    const user_id = body.user_id ?? null;

    const {data, error} = await supabaseAdmin
      .from('posts')
      .insert([{user_id, content, layer}])
      .select('*')
      .single();

    if(error) return NextResponse.json({error: error.message},{status:500});

    // Create a user_event for scoring
    const event = {user_id: user_id, event_type: 'post_created', points_earned: 5, metadata: {post_id: data.id}};
    await supabaseAdmin.from('user_events').insert([event]);

    // Compute score delta and atomically increment user score via RPC
    if(user_id){
      const scoreDelta = calculateAkorfaScore({postsCreated:1});
      await supabaseAdmin.rpc('increment_user_score', {p_user_id: user_id, p_delta: scoreDelta});
    }

    return NextResponse.json({post: data});
  }catch(err:any){
    console.error(err);
    return NextResponse.json({error: err.message ?? String(err)},{status:500});
  }
}
