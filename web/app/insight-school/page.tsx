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
  brain: <Brain className="w-4 h-4" />,
  'book-open': <BookOpen className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  crown: <Crown className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />
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
    <div className="max-w-4xl mx-auto space-y-4 px-3 py-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
          <Brain className="w-3.5 h-3.5" />
          Insight School
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Master Human Systems
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Learn about human behavior, social systems, and your role in society.
        </p>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">The Stability Equation</h3>
            <p className="text-white/80 text-xs">S = R(L+G) / (|L-G| + C)</p>
          </div>
          <Link
            href="/insight-school/stability-equation"
            className="px-3 py-1.5 bg-white text-indigo-600 rounded-md text-xs font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            Learn
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Foundation Tracks
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {foundationTracks.map((track) => (
            <TrackCard key={track.id} track={track} userId={userId} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-amber-500" />
          Advanced Tracks
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {advancedTracks.map((track) => (
            <TrackCard key={track.id} track={track} userId={userId} />
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          AI Mentor
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
          Chat with your personal AI mentor about human systems.
        </p>
        <Link
          href="/ai-mentor"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors"
        >
          <Brain className="w-3.5 h-3.5" />
          Talk to Mentor
          <ChevronRight className="w-3.5 h-3.5" />
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
      className="block bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div 
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${track.color}20` }}
        >
          <div style={{ color: track.color }}>
            {ICON_MAP[track.icon] || <BookOpen className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {track.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {track.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
            <span>{track.totalLessons} lessons</span>
            <span>{track.estimatedMinutes} min</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : isStarted ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${track.color}20` }}>
              <span className="text-[10px] font-bold" style={{ color: track.color }}>{progress}%</span>
            </div>
          ) : (
            <Play className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          )}
        </div>
      </div>
      {isStarted && !isCompleted && (
        <div className="mt-2">
          <div className="h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
