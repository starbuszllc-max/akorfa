'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Star, Flame, Search, TrendingUp, Target, Brain, Heart, Users, Leaf, Sparkles, Zap, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

const EXCLUDED_PATHS = ['/profile/settings', '/login', '/signup', '/logout', '/onboarding'];

const LAYER_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  environment: { color: 'bg-green-500', icon: <Leaf className="w-2.5 h-2.5" /> },
  bio: { color: 'bg-red-500', icon: <Heart className="w-2.5 h-2.5" /> },
  internal: { color: 'bg-purple-500', icon: <Brain className="w-2.5 h-2.5" /> },
  cultural: { color: 'bg-yellow-500', icon: <Star className="w-2.5 h-2.5" /> },
  social: { color: 'bg-blue-500', icon: <Users className="w-2.5 h-2.5" /> },
  conscious: { color: 'bg-green-500', icon: <Zap className="w-2.5 h-2.5" /> },
  existential: { color: 'bg-pink-500', icon: <Sparkles className="w-2.5 h-2.5" /> },
};

interface LayerScore {
  name: string;
  score: number;
  color: string;
  icon: React.ReactNode;
}

export default function EnhancedHeader() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [akorfaScore, setAkorfaScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [layerScores, setLayerScores] = useState<LayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualCollapse, setManualCollapse] = useState(false);
  const [scrollPaused, setScrollPaused] = useState(false);
  
  const isScrolledUp = useScrollVisibility({ threshold: 30 });
  const scrollPauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Show expanded only when scrolled up; hide from homepage only
  const isExpanded = isScrolledUp;
  const isHomepageOrFeed = pathname === '/';
  
  const isExcludedPage = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));
  const isNotificationPage = pathname === '/notifications';
  const isDiscoverPage = pathname === '/discover';

  // Removed scroll pause auto-expand - only user interaction expands now

  useEffect(() => {
    if (isScrolledUp) {
      setManualCollapse(false);
    }
  }, [isScrolledUp]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('demo_user_id');
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchData();
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotificationCount = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const fetchData = async () => {
    if (!userId) return;
    try {
      const [profileRes, streakRes, assessmentRes] = await Promise.all([
        fetch(`/api/profiles?userId=${userId}`),
        fetch(`/api/streaks?userId=${userId}`),
        fetch(`/api/assessments?userId=${userId}`)
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setAkorfaScore(profileData.profile?.akorfaScore || profileData.profile?.akorfa_score || 0);
      }

      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setStreak(streakData.currentStreak || 0);
      }

      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json();
        if (assessmentData.assessments && assessmentData.assessments.length > 0) {
          const latest = assessmentData.assessments[0];
          const scores = latest.layerScores || latest.layer_scores || {};
          const formattedScores: LayerScore[] = Object.entries(scores).map(([key, value]) => ({
            name: key,
            score: typeof value === 'number' ? value : 0,
            color: LAYER_CONFIG[key]?.color || 'bg-gray-500',
            icon: LAYER_CONFIG[key]?.icon || <Target className="w-2.5 h-2.5" />
          }));
          setLayerScores(formattedScores);
        }
      }
    } catch (error) {
      console.error('Failed to fetch HUD data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isExcludedPage || isHomepageOrFeed) return null;

  const averageLayerScore = layerScores.length > 0 
    ? Math.round(layerScores.reduce((sum, l) => sum + l.score, 0) / layerScores.length) 
    : 0;

  const lowestLayer = layerScores.length > 0 
    ? layerScores.reduce((min, l) => l.score < min.score ? l : min, layerScores[0])
    : null;

  return (
    <div className="fixed right-0 z-50" style={{ top: '100px', paddingRight: '5px' }}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-end gap-0.5"
          >
            {!isDiscoverPage && (
              <Link
                href="/discover"
                className="w-14 h-14 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Search className="w-8 h-8 text-white" strokeWidth={2.5} style={{filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.8)) drop-shadow(-2px -2px 8px rgba(0, 0, 0, 0.7)) drop-shadow(inset 0 1px 3px rgba(0, 0, 0, 0.8))'}} />
              </Link>
            )}

            {!isNotificationPage && (
              <Link
                href="/notifications"
                className="relative w-14 h-14 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Bell className="w-8 h-8 text-white" strokeWidth={2.5} style={{filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.8)) drop-shadow(-2px -2px 8px rgba(0, 0, 0, 0.7)) drop-shadow(inset 0 1px 3px rgba(0, 0, 0, 0.8))'}} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {userId && (
              <>
                <Link
                  href="/profile"
                  className="relative w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex flex-col items-center justify-center hover:bg-black/50 transition-transform"
                >
                  <Star className="w-5 h-5 text-white" strokeWidth={2.5} style={{filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.8)) drop-shadow(-2px -2px 8px rgba(0, 0, 0, 0.7))'}} />
                  <span className="text-[9px] font-bold text-white" style={{filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.8))'}}>
                    {loading ? '...' : Math.round(akorfaScore)}
                  </span>
                </Link>

                <Link
                  href="/daily-challenges"
                  className="relative w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex flex-col items-center justify-center hover:bg-black/50 transition-transform"
                >
                  <Flame className="w-5 h-5 text-orange-400" strokeWidth={2.5} style={{filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.8)) drop-shadow(-2px -2px 8px rgba(0, 0, 0, 0.7))'}} />
                  <span className="text-[9px] font-bold text-white" style={{filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.8))'}}>
                    {streak}d
                  </span>
                </Link>

                <Link
                  href="/assessments"
                  className="relative w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex flex-col items-center justify-center hover:bg-black/50 transition-transform"
                >
                  <TrendingUp className="w-5 h-5 text-green-400" strokeWidth={2.5} style={{filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.8)) drop-shadow(-2px -2px 8px rgba(0, 0, 0, 0.7))'}} />
                  <span className="text-[9px] font-bold text-white" style={{filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.8))'}}>
                    {averageLayerScore}%
                  </span>
                </Link>

                {lowestLayer && lowestLayer.score < 70 && (
                  <Link
                    href="/assessments"
                    className="relative w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex flex-col items-center justify-center hover:bg-black/50 transition-transform"
                  >
                    <div className={`w-6 h-6 ${lowestLayer.color} rounded-full flex items-center justify-center`}>
                      {lowestLayer.icon}
                    </div>
                    <span className="text-[8px] font-medium text-white capitalize" style={{filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.8))'}}>
                      {lowestLayer.name.slice(0, 4)}
                    </span>
                  </Link>
                )}

                <Link
                  href="/feed"
                  className="relative w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-transform"
                >
                  <Heart className="w-5 h-5 text-red-400" strokeWidth={2.5} style={{filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.8)) drop-shadow(-2px -2px 8px rgba(0, 0, 0, 0.7))'}} />
                </Link>
              </>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors shadow-lg"
          >
            {userId && (
              <>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-white">{loading ? '...' : Math.round(akorfaScore)}</span>
                </div>
                <div className="w-px h-4 bg-white/30" />
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-white">{streak}d</span>
                </div>
              </>
            )}
            {unreadCount > 0 && (
              <>
                <div className="w-px h-4 bg-white/30" />
                <div className="relative">
                  <Bell className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[7px] rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-white/70" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
