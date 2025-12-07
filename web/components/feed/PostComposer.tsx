'use client';
import React, {useState} from 'react';
import {supabaseClient} from '../../lib/supabaseClient';
import Button from '../ui/Button';

const layers = ['environment','bio','internal','cultural','social','conscious','existential'] as const;

export default function PostComposer(){
  const [content, setContent] = useState('');
  const [layer, setLayer] = useState('social');
  const [loading, setLoading] = useState(false);

  async function submitPost(e?: React.FormEvent){
    if(e) e.preventDefault();
    if(!content.trim()) return;
    setLoading(true);
    try{
      const {data: sessionData} = await supabaseClient.auth.getSession();
      const user_id = sessionData?.session?.user?.id ?? null;
      const resp = await fetch('/api/posts',{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({content, layer, user_id})
      });
      if(resp.ok){
        setContent('');
        // Optionally trigger a feed refresh via event or simple reload
        window.location.reload();
      } else {
        console.error(await resp.json());
      }
    } catch(err){ console.error(err);} finally { setLoading(false);}  
  }

  return (
    <form onSubmit={submitPost} className="p-4 bg-white rounded shadow-sm">
      <textarea aria-label="Create post" className="w-full border p-2 rounded" rows={4} value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Share something..." />
      <div className="flex items-center justify-between mt-2">
        <select value={layer} onChange={(e)=>setLayer(e.target.value)} className="border rounded px-2 py-1">
          {layers.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <Button type="submit" disabled={loading}>{loading ? 'Posting…' : 'Post'}</Button>
      </div>
    </form>
  );
}
