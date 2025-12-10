'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Flame, TrendingUp, Zap, Medal, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  akorfaScore: number;
  totalXp: number;
  level: number;
  currentStreak: number;
}

const tabs = [
  { id: 'xp', label: 'XP', icon: Zap },
  { id: 'score', label: 'Score', icon: TrendingUp },
  { id: 'streak', label: 'Streak', icon: Flame },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState('xp');
  const [loading, setLoading] = useState(true);
  const [userId] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  async function fetchLeaderboard(type: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${type}&limit=50`);
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    }
    setLoading(false);
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700';
  };

  return (
    <div className="max-w-3xl mx-auto px-3">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
          <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Leaderboard
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Community rankings
        </p>
      </div>

      <div className="flex justify-center gap-1.5 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              onClick={() => router.push(`/profile/${entry.id}`)}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${getRankBg(entry.rank)} ${
                entry.id === userId ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 text-center">
                  {getRankIcon(entry.rank) || (
                    <span className={`text-base font-bold ${
                      entry.rank <= 10 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                    }`}>
                      {entry.rank}
                    </span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {(entry.fullName || entry.username || '?')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {entry.fullName || entry.username}
                    {entry.id === userId && (
                      <span className="ml-1.5 text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Level {entry.level || 1}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    {activeTab === 'xp' && `${entry.totalXp || 0} XP`}
                    {activeTab === 'score' && `${entry.akorfaScore.toFixed(1)}`}
                    {activeTab === 'streak' && (
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {entry.currentStreak || 0}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No users on the leaderboard yet. Be the first!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
