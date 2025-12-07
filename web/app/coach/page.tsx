'use client';

import React, { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { AICoach } from '../../components/coach';
import { Sparkles } from 'lucide-react';

export default function CoachPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let uid: string | null = null;
      
      const demoUserId = localStorage.getItem('demo_user_id');
      if (demoUserId) {
        uid = demoUserId;
      } else {
        const client = supabaseClient();
        const { data: sessionData } = await client.auth.getSession();
        uid = sessionData?.session?.user?.id || null;
      }
      
      setUserId(uid);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
        <p className="text-gray-600">Please sign in to access your AI Growth Coach.</p>
        <a href="/login" className="mt-4 inline-block text-indigo-600 hover:underline">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Growth Coach</h1>
              <p className="text-indigo-100 text-sm">Your personal guide to balanced development</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 h-[600px]">
          <AICoach userId={userId} />
        </div>
      </div>
    </div>
  );
}
