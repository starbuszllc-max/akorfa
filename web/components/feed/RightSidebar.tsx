'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface TopContributor {
  id: string;
  username: string;
  avatarUrl: string | null;
  score: number;
}

interface LayerStats {
  name: string;
  count: number;
  color: string;
}

const layerColors: Record<string, string> = {
  environment: 'bg-emerald-500',
  bio: 'bg-rose-500',
  internal: 'bg-purple-500',
  cultural: 'bg-amber-500',
  social: 'bg-blue-500',
  conscious: 'bg-indigo-500',
  existential: 'bg-violet-500',
};

export default function RightSidebar() {
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [popularLayers, setPopularLayers] = useState<LayerStats[]>([]);
  const [userStreak, setUserStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, layerStatsRes] = await Promise.all([
          fetch('/api/leaderboard?limit=5'),
          fetch('/api/layer-stats')
        ]);
        
        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          if (data.leaderboard) {
            setTopContributors(data.leaderboard.slice(0, 5).map((user: any) => ({
              id: user.id,
              username: user.username || 'Anonymous',
              avatarUrl: user.avatarUrl,
              score: user.akorfaScore || 0
            })));
          }
        }

        if (layerStatsRes.ok) {
          const data = await layerStatsRes.json();
          if (data.layers) {
            setPopularLayers(data.layers.slice(0, 5).map((layer: any) => ({
              name: layer.name,
              count: layer.count,
              color: layerColors[layer.name] || 'bg-gray-500'
            })));
          }
        }

        setUserStreak(0);
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl animate-pulse">
            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
            <div className="space-y-2">
              <div className="h-8 bg-gray-100 dark:bg-slate-700/50 rounded" />
              <div className="h-8 bg-gray-100 dark:bg-slate-700/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sticky top-20">
      {userStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔥</div>
            <div>
              <div className="font-semibold text-amber-800 dark:text-amber-200">{userStreak} Day Streak!</div>
              <div className="text-sm text-amber-600 dark:text-amber-400">Keep sharing your journey</div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Top Contributors</h3>
          <Link href="/leaderboard" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            View All
          </Link>
        </div>
        <div className="space-y-2">
          {topContributors.map((user, idx) => (
            <Link key={user.id} href={`/profile/${user.id}`} className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg p-1 -m-1 transition-colors cursor-pointer">
              <span className={`w-5 text-center text-xs font-bold ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-400'}`}>
                {idx + 1}
              </span>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-800" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-indigo-200 dark:ring-indigo-800">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{user.username}</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{Math.round(user.score)}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Popular Layers</h3>
        <div className="space-y-2">
          {popularLayers.map((layer) => (
            <div key={layer.name} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${layer.color}`} />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 capitalize">{layer.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{layer.count} posts</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50"
      >
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 text-sm mb-2">Quick Actions</h3>
        <div className="space-y-2">
          <Link href="/stories" className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
            <span>📚</span> View Stories
          </Link>
          <Link href="/assessments" className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
            <span>📊</span> Take an Assessment
          </Link>
          <Link href="/challenges" className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
            <span>🎯</span> Join a Challenge
          </Link>
          <Link href="/coach" className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
            <span>🤖</span> Talk to AI Coach
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
