'use client';
import React, { useEffect, useState, useCallback } from 'react';
import ChallengeCard from './ChallengeCard';

interface Challenge {
  id: string;
  title: string;
  description: string;
  layer: string;
  durationDays: number;
  pointsReward: number;
  participantCount: number;
  startsAt: string;
  endsAt: string;
  creator?: {
    username: string | null;
    avatarUrl: string | null;
  } | null;
}

interface ChallengeListProps {
  refreshTrigger?: number;
}

export default function ChallengeList({ refreshTrigger }: ChallengeListProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userParticipations, setUserParticipations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null;
      setCurrentUserId(storedUserId);

      const url = storedUserId 
        ? `/api/challenges?user_id=${storedUserId}`
        : '/api/challenges';
      
      const resp = await fetch(url);
      const data = await resp.json();

      if (resp.ok && data.challenges) {
        setChallenges(data.challenges);
        setUserParticipations(data.userParticipations || []);
      } else {
        console.error('Error fetching challenges:', data.error);
        setChallenges([]);
      }
    } catch (err) {
      console.error(err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges, refreshTrigger]);

  const handleJoin = (challengeId: string) => {
    setUserParticipations(prev => [...prev, challengeId]);
    setChallenges(prev => prev.map(c => 
      c.id === challengeId 
        ? { ...c, participantCount: (c.participantCount ?? 0) + 1 }
        : c
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-500">Loading challenges...</span>
        </div>
      </div>
    );
  }

  if (!challenges.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="font-medium text-gray-800 mb-1">No challenges yet</h3>
        <p className="text-gray-500">Be the first to create a challenge!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {challenges.map(challenge => (
        <ChallengeCard 
          key={challenge.id} 
          challenge={{
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            layer: challenge.layer,
            duration_days: challenge.durationDays ?? 7,
            points_reward: challenge.pointsReward ?? 50,
            participant_count: challenge.participantCount ?? 0,
            starts_at: challenge.startsAt,
            ends_at: challenge.endsAt,
            creator: challenge.creator ? {
              username: challenge.creator.username,
              avatar_url: challenge.creator.avatarUrl
            } : null
          }}
          currentUserId={currentUserId}
          isJoined={userParticipations.includes(challenge.id)}
          onJoin={handleJoin}
        />
      ))}
    </div>
  );
}
