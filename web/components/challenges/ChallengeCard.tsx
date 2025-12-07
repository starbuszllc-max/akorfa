'use client';
import React, { useState } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  layer: string;
  duration_days: number;
  points_reward: number;
  participant_count: number;
  starts_at: string;
  ends_at: string;
  creator?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string | null;
  isJoined: boolean;
  onJoin: (challengeId: string) => void;
}

const layerColors: Record<string, string> = {
  environment: 'bg-green-100 text-green-800 border-green-200',
  biological: 'bg-blue-100 text-blue-800 border-blue-200',
  internal: 'bg-purple-100 text-purple-800 border-purple-200',
  cultural: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  social: 'bg-pink-100 text-pink-800 border-pink-200',
  conscious: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  existential: 'bg-red-100 text-red-800 border-red-200'
};

export default function ChallengeCard({ challenge, currentUserId, isJoined, onJoin }: ChallengeCardProps) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!currentUserId || isJoined) return;
    
    setJoining(true);
    try {
      const resp = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challenge.id,
          user_id: currentUserId
        })
      });
      
      if (resp.ok) {
        onJoin(challenge.id);
      } else {
        const data = await resp.json();
        console.error('Failed to join:', data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const daysRemaining = () => {
    if (!challenge.ends_at) return null;
    const end = new Date(challenge.ends_at);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const remaining = daysRemaining();
  const layerStyle = layerColors[challenge.layer?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${layerStyle}`}>
              {challenge.layer}
            </span>
            <span className="text-xs text-gray-500">
              +{challenge.points_reward} pts
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">{challenge.title}</h3>
        </div>
        <div className="text-2xl">🎯</div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{challenge.description}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            👥 {challenge.participant_count ?? 0} joined
          </span>
          <span className="flex items-center gap-1">
            📅 {challenge.duration_days} days
          </span>
        </div>
        {remaining !== null && (
          <span className={remaining <= 2 ? 'text-red-500 font-medium' : ''}>
            {remaining} days left
          </span>
        )}
      </div>

      {challenge.creator?.username && (
        <div className="text-xs text-gray-400 mb-3">
          Created by @{challenge.creator.username}
        </div>
      )}

      {currentUserId ? (
        isJoined ? (
          <button 
            className="w-full py-2 px-4 rounded-lg bg-green-100 text-green-700 font-medium cursor-default"
            disabled
          >
            ✓ Joined
          </button>
        ) : (
          <button 
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Challenge'}
          </button>
        )
      ) : (
        <div className="text-center text-sm text-gray-500 py-2">
          Enable demo mode to join challenges
        </div>
      )}
    </div>
  );
}
