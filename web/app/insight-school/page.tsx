'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain, BookOpen, Users, Crown, Zap, ChevronRight, Play, CheckCircle, Lock } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  totalLessons: number;
  estimatedMinutes: number;
  userProgress?: {
    progress: number;
    completedLessons: number;
    status: string;
  };
}

const ICON_MAP: { [key: string]: React.ReactNode } = {
  brain: <Brain className="w-6 h-6" />,
  'book-open': <BookOpen className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />
};

const DEFAULT_TRACKS: Track[] = [
  {
    id: '1',
    name: 'Human Behavior OS',
    slug: 'human-behavior-os',
    description: 'Understand emotions, cognitive biases, perception, and decision-making patterns that drive human action.',
    icon: 'brain',
    color: '#8b5cf6',
    category: 'foundation',
    totalLessons: 12,
    estimatedMinutes: 120
  },
  {
    id: '2',
    name: 'Social Systems OS',
    slug: 'social-systems-os',
    description: 'Learn how communities build trust, maintain cohesion, and govern themselves effectively.',
    icon: 'users',
    color: '#06b6d4',
    category: 'foundation',
    totalLessons: 10,
    estimatedMinutes: 100
  },
  {
    id: '3',
    name: 'Leadership OS',
    slug: 'leadership-os',
    description: 'Master influence, power dynamics, ethical leadership, and vision-setting for impact.',
    icon: 'crown',
    color: '#f59e0b',
    category: 'advanced',
    totalLessons: 15,
    estimatedMinutes: 180
  },
  {
    id: '4',
    name: 'Stability Equation',
    slug: 'stability-equation',
    description: 'Deep dive into the S = R(L+G) / (|L-G| + C) formula and its real-world applications.',
    icon: 'zap',
    color: '#10b981',
    category: 'advanced',
    totalLessons: 8,
    estimatedMinutes: 90
  }
];

const LESSON_COUNTS: { [key: string]: number } = {
  'human-behavior-os': 5,
  'social-systems-os': 4,
  'leadership-os': 4,
  'stability-equation': 5
};

export default function InsightSchoolPage() {
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [localProgress, setLocalProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const uid = localStorage.getItem('demo_user_id');
    setUserId(uid);
    fetchTracks(uid);
    
    const progress: { [key: string]: number } = {};
    DEFAULT_TRACKS.forEach(track => {
      const saved = localStorage.getItem(`completed_lessons_${track.slug}`);
      if (saved) {
        const completed = JSON.parse(saved);
        const total = LESSON_COUNTS[track.slug] || track.totalLessons;
        progress[track.slug] = Math.round((completed.length / total) * 100);
      } else {
        progress[track.slug] = 0;
      }
    });
    setLocalProgress(progress);
  }, []);

  async function fetchTracks(uid: string | null) {
    try {
      const url = uid ? `/api/learning-tracks?user_id=${uid}` : '/api/learning-tracks';
      const res = await fetch(url);
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error('Error fetching tracks:', err);
    }
    setLoading(false);
  }

  const tracksWithProgress = tracks.map(track => ({
    ...track,
    userProgress: {
      progress: localProgress[track.slug] || track.userProgress?.progress || 0,
      completedLessons: 0,
      status: localProgress[track.slug] === 100 ? 'completed' : 'in_progress'
    }
  }));

  const foundationTracks = tracksWithProgress.filter(t => t.category === 'foundation');
  const advancedTracks = tracksWithProgress.filter(t => t.category === 'advanced');

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
          <Brain className="w-4 h-4" />
          Akorfa Insight School
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Master Human Systems
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Learn deeply about human behavior, social systems, governance, resilience, and your role in society. 
          Think of it as TikTok + Khan Academy + AI Mentor in one place.
        </p>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Zap className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">The Stability Equation</h3>
            <p className="text-white/80 text-sm mt-1">
              S = R(L+G) / (|L-G| + C) — Understanding how societies stay stable
            </p>
          </div>
          <Link
            href="/insight-school/stability-equation"
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Foundation Tracks
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {foundationTracks.map((track) => (
            <TrackCard key={track.id} track={track} userId={userId} />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          Advanced Tracks
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {advancedTracks.map((track) => (
            <TrackCard key={track.id} track={track} userId={userId} />
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your AI Mentor Awaits
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Have questions about human systems? Chat with your personal AI mentor who specializes in teaching 
          about behavior, social dynamics, and leadership.
        </p>
        <Link
          href="/ai-mentor"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Brain className="w-4 h-4" />
          Talk to AI Mentor
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function TrackCard({ track, userId }: { track: Track; userId: string | null }) {
  const progress = track.userProgress?.progress || 0;
  const isStarted = progress > 0;
  const isCompleted = track.userProgress?.status === 'completed';

  return (
    <Link
      href={`/insight-school/${track.slug}`}
      className="block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${track.color}20` }}
        >
          <div style={{ color: track.color }}>
            {ICON_MAP[track.icon] || <BookOpen className="w-6 h-6" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {track.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {track.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{track.totalLessons} lessons</span>
            <span>{track.estimatedMinutes} min</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : isStarted ? (
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${track.color}20` }}>
              <span className="text-xs font-bold" style={{ color: track.color }}>{progress}%</span>
            </div>
          ) : (
            <Play className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          )}
        </div>
      </div>
      {isStarted && !isCompleted && (
        <div className="mt-4">
          <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: track.color }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
