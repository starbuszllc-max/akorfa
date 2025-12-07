'use client';

import React, {useEffect, useState} from 'react';
import {supabaseClient} from '../../lib/supabaseClient';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const client = supabaseClient();
      const {data: sessionData} = await client.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      setUserId(uid || null);
      
      if (!uid) {
        setLoading(false);
        return;
      }

      const {data, error: fetchError} = await client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
        setError(fetchError.message);
      } else {
        setProfile(data);
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
    <div className="bg-white p-6 rounded-md shadow max-w-md">
      <h1 className="text-xl font-bold">{profile.full_name || profile.username}</h1>
      <p className="text-sm text-gray-600">Akorfa Score: {profile.akorfa_score}</p>
      <p className="mt-3 text-gray-700">{profile.bio}</p>
    </div>
  );
}
