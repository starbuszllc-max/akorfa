'use client';

import React, { useEffect, useState } from 'react';
import { AICoach } from '../../components/coach';
import { VoiceCoach } from '../../components/coach/VoiceCoach';
import { Sparkles, MessageSquare, Mic } from 'lucide-react';

export default function CoachPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  useEffect(() => {
    const demoUserId = localStorage.getItem('demo_user_id');
    setUserId(demoUserId);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          AI Growth Coach
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Get personalized guidance for your self-discovery journey. Complete onboarding to access your AI coach.
        </p>
        <a
          href="/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
        >
          Get Started
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">AI Coach</h1>
                <p className="text-indigo-100 text-xs">Personal growth guide</p>
              </div>
            </div>
            
            <div className="flex bg-white/20 rounded-md p-0.5">
              <button
                onClick={() => setMode('text')}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                  mode === 'text' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Text
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                  mode === 'voice' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Voice
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {mode === 'text' ? (
            <div className="h-[400px]">
              <AICoach userId={userId} />
            </div>
          ) : (
            <VoiceCoach userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
