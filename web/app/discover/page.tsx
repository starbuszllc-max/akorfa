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
    <div className="max-w-4xl mx-auto px-3 py-4 space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full text-xs font-medium">
          <Globe className="w-3.5 h-3.5" />
          Discover
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Explore Communities
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Find local and global communities
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search communities..."
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-3 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Near You</h3>
            <p className="text-white/80 text-xs">Local stories & updates</p>
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
            className="px-3 py-1.5 bg-white text-cyan-600 rounded-md text-xs font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            Enable
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Trending
          </h2>
          <Link href="/communities" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            View All
          </Link>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {filteredBoards.slice(0, 6).map((board) => (
            <div
              key={board.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {board.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {board.name}
                    </h3>
                    {board.isOfficial && (
                      <span className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] rounded flex-shrink-0">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {board.city ? `${board.city}, ${board.country}` : board.country}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      {board.memberCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      {board.postCount.toLocaleString()}
                    </span>
                  </div>
                </div>
                {userId && (
                  <button
                    onClick={() => joinBoard(board.id)}
                    disabled={board.isMember}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
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

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Create a Community
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
          Start your own community board.
        </p>
        <Link
          href="/communities/create"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors"
        >
          Create
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
