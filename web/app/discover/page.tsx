'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Users, Flame, TrendingUp, Globe, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

interface CommunityBoard {
  id: string;
  name: string;
  description?: string;
  city?: string;
  region?: string;
  country?: string;
  memberCount: number;
  postCount: number;
  avatarUrl?: string;
  isOfficial: boolean;
  isMember?: boolean;
}

const FEATURED_BOARDS: CommunityBoard[] = [
  { id: '1', name: 'Ghana Creators Club', city: 'Accra', country: 'Ghana', memberCount: 1250, postCount: 3420, isOfficial: true },
  { id: '2', name: 'System Thinkers Club', country: 'Global', memberCount: 890, postCount: 1560, isOfficial: true },
  { id: '3', name: 'Akorfa Insight Learners', country: 'Global', memberCount: 2100, postCount: 4200, isOfficial: true },
  { id: '4', name: 'Leadership OS Club', country: 'Global', memberCount: 650, postCount: 980, isOfficial: true }
];

export default function DiscoverPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [boards, setBoards] = useState<CommunityBoard[]>(FEATURED_BOARDS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ city?: string; country?: string } | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('demo_user_id');
    setUserId(uid);
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const res = await fetch('/api/community-boards');
      const data = await res.json();
      if (data.boards && data.boards.length > 0) {
        setBoards(data.boards);
      }
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
    setLoading(false);
  }

  async function joinBoard(boardId: string) {
    if (!userId) return;
    
    try {
      const res = await fetch('/api/community-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          board_id: boardId,
          action: 'join'
        })
      });

      if (res.ok) {
        setBoards(prev => prev.map(b => 
          b.id === boardId ? { ...b, isMember: true, memberCount: b.memberCount + 1 } : b
        ));
      }
    } catch (err) {
      console.error('Error joining board:', err);
    }
  }

  const filteredBoards = searchQuery 
    ? boards.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.country?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : boards;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full text-sm font-medium">
          <Globe className="w-4 h-4" />
          Discover
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Explore Communities
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Find local and global communities, see what's trending near you
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search communities, cities, or topics..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold">What's Happening Near You</h3>
            <p className="text-white/80 text-xs sm:text-sm mt-1">
              Discover local stories, trending topics, and community updates
            </p>
          </div>
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => console.log('Location:', pos),
                  (err) => console.log('Location error:', err)
                );
              }
            }}
            className="w-full sm:w-auto px-4 py-2 bg-white text-cyan-600 rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
          >
            Enable Location
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Communities
          </h2>
          <Link href="/communities" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            View All
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredBoards.slice(0, 6).map((board) => (
            <div
              key={board.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {board.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {board.name}
                    </h3>
                    {board.isOfficial && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {board.city ? `${board.city}, ${board.country}` : board.country}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {board.memberCount.toLocaleString()} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {board.postCount.toLocaleString()} posts
                    </span>
                  </div>
                </div>
                {userId && (
                  <button
                    onClick={() => joinBoard(board.id)}
                    disabled={board.isMember}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      board.isMember
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {board.isMember ? 'Joined' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create a Community
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Start your own community board for your city, school, or interest group.
        </p>
        <Link
          href="/communities/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Create Community
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
