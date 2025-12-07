import React, {useEffect, useState} from 'react';
import {supabaseClient} from '../../lib/supabaseClient';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const {data: sessionData} = await supabaseClient.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      const {data, error} = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.error(error);
        return;
      }
      setProfile(data);
    })();
  }, []);

  if (!profile) {
    return <div className="text-gray-600">No profile found or not signed in.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-md shadow max-w-md">
      <h1 className="text-xl font-bold">{profile.full_name || profile.username}</h1>
      <p className="text-sm text-gray-600">Akorfa Score: {profile.akorfa_score}</p>
      <p className="mt-3 text-gray-700">{profile.bio}</p>
    </div>
  );
}
