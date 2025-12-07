'use client';

import React, {useEffect, useState} from 'react';
import {supabaseClient} from '../../lib/supabaseClient';
import { BadgesList, LevelDisplay } from '../../components/badges';
import { ActivityHeatmap } from '../../components/heatmap';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let uid: string | null = null;
      
      const demoUserId = localStorage.getItem('demo_user_id');
      if (demoUserId) {
        uid = demoUserId;
      } else {
        const client = supabaseClient();
        const {data: sessionData} = await client.auth.getSession();
        uid = sessionData?.session?.user?.id || null;
      }
      
      setUserId(uid);
      
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/profiles?user_id=${uid}`);
        const data = await res.json();
        if (data.profile && !data.error) {
          const p = data.profile;
          setProfile({
            id: p.id,
            username: p.username,
            full_name: p.fullName,
            avatar_url: p.avatarUrl,
            bio: p.bio,
            akorfa_score: p.akorfaScore,
            layer_scores: p.layerScores,
            metadata: p.metadata
          });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
      setLoading(false);
    })();
  }, []);

  async function createProfile() {
    if (!userId) return;
    setCreating(true);
    setError(null);
    
    const client = supabaseClient();
    const {data: sessionData} = await client.auth.getSession();
    const email = sessionData?.session?.user?.email || 'user';
    
    const {data, error: insertError} = await client
      .from('profiles')
      .insert({
        id: userId,
        username: email,
        full_name: email.split('@')[0],
        akorfa_score: 0,
        bio: ''
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Profile creation error:', insertError);
      setError(insertError.message);
    } else {
      setProfile(data);
    }
    setCreating(false);
  }

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="bg-white p-6 rounded-md shadow max-w-md">
        <p className="text-gray-600">Please sign in to view your profile.</p>
        <a href="/login" className="mt-4 inline-block text-indigo-600 hover:underline">
          Go to Login
        </a>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-6 rounded-md shadow max-w-md">
        <h1 className="text-xl font-bold mb-4">No Profile Found</h1>
        <p className="text-gray-600 mb-4">
          It looks like your profile hasn't been created yet.
        </p>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <button
          onClick={createProfile}
          disabled={creating}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Profile'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{profile.full_name || profile.username}</h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </div>
        {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
        
        <LevelDisplay score={Number(profile.akorfa_score || 0)} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Activity</h2>
        <ActivityHeatmap userId={userId!} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Achievements</h2>
        <BadgesList userId={userId!} />
      </div>
    </div>
  );
}
