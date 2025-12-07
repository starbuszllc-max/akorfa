'use client';
import React, {useEffect, useState} from 'react';
import PostCard from './PostCard';
import {supabaseClient} from '../../lib/supabaseClient';

export default function FeedList(){
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      setLoading(true);
      try{
        const {data} = await supabaseClient.from('posts').select('*').order('created_at',{ascending:false}).limit(50);
        setPosts(data ?? []);
      }catch(err){console.error(err);}finally{setLoading(false);}    
    })();
  },[]);

  if(loading) return <div>Loading feed…</div>;
  if(!posts.length) return <div className="text-gray-600">No posts yet.</div>;

  return (
    <div className="space-y-4">
      {posts.map(p => <PostCard key={p.id} post={p} />)}
    </div>
  );
}
