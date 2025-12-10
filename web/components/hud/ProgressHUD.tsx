'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, TrendingUp, ChevronUp, ChevronDown, Zap, Target, Brain, Heart, Users, Leaf, Sparkles, Bell } from 'lucide-react';
import Link from 'next/link';

interface LayerScore {
  name: string;
  score: number;
  color: string;
  icon: React.ReactNode;
}

const LAYER_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  environment: { color: 'bg-green-500', icon: <Leaf className="w-3 h-3" /> },
  bio: { color: 'bg-red-500', icon: <Heart className="w-3 h-3" /> },
  internal: { color: 'bg-purple-500', icon: <Brain className="w-3 h-3" /> },
  cultural: { color: 'bg-yellow-500', icon: <Star className="w-3 h-3" /> },
  social: { color: 'bg-blue-500', icon: <Users className="w-3 h-3" /> },
  conscious: { color: 'bg-indigo-500', icon: <Zap className="w-3 h-3" /> },
  existential: { color: 'bg-pink-500', icon: <Sparkles className="w-3 h-3" /> },
};

interface ProgressHUDProps {
  userId?: string;
  isVisible?: boolean;
  sticky?: boolean;
}

export default function ProgressHUD({ userId, isVisible = true, sticky = false }: ProgressHUDProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aKorfaScore, setAkorfaScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [layerScores, setLayerScores] = useState<LayerScore[]>([]);
  const [showHUD, setShowHUD] = useState(true);
  const [showNotificationIcon, setShowNotificationIcon] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetchData();
    fetchNotificationCount();
  }, [userId]);

  useEffect(() => {
    if (!isVisible || sticky) return;
    
    setShowHUD(true);
    setShowNotificationIcon(false);
    
    const timer = setTimeout(() => {
      setShowHUD(false);
      setTimeout(() => {
        setShowNotificationIcon(true);
      }, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isVisible, sticky]);

  const fetchNotificationCount = async () => {
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
            icon: LAYER_CONFIG[key]?.icon || <Target className="w-3 h-3" />
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

  if (!userId) return null;

  const averageLayerScore = layerScores.length > 0 
    ? Math.round(layerScores.reduce((sum, l) => sum + l.score, 0) / layerScores.length) 
    : 0;

  const lowestLayer = layerScores.length > 0 
    ? layerScores.reduce((min, l) => l.score < min.score ? l : min, layerScores[0])
    : null;

  const handleNotificationClick = () => {
    setShowNotificationIcon(false);
    setShowHUD(true);
  };

  const positionClasses = sticky 
    ? "sticky top-0 z-40 mb-4" 
    : "fixed top-20 right-4 z-40";

  return (
    <div className={positionClasses}>
      <AnimatePresence mode="wait">
        {isVisible && showHUD && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.div
              layout
              className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden ${
                expanded ? 'w-64' : 'w-auto'
              }`}
            >
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <Star className="w-3.5 h-3.5 text-white" />
                </div>
                {streak > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Flame className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-left">
                <div className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                  {loading ? '...' : Math.round(aKorfaScore)}
                </div>
              </div>
            </div>

            {!expanded && streak > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Flame className="w-2.5 h-2.5 text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">{streak}</span>
              </div>
            )}

            <div className="ml-auto">
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100 dark:border-slate-700"
              >
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Flame className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
                        <div className="font-semibold text-orange-600 dark:text-orange-400">{streak} days</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Balance</div>
                        <div className="font-semibold text-green-600 dark:text-green-400">{averageLayerScore}%</div>
                      </div>
                    </div>
                  </div>

                  {layerScores.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Layer Balance</div>
                      <div className="flex gap-1">
                        {layerScores.map((layer) => (
                          <div 
                            key={layer.name}
                            className="flex-1 group relative"
                          >
                            <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                              <div
                                className={`h-full ${layer.color} transition-all duration-500`}
                                style={{ height: `${layer.score}%` }}
                              />
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {layer.name}: {layer.score}%
                              </div>
                            </div>
                            <div className="flex justify-center mt-1">
                              <div className={`w-5 h-5 rounded-full ${layer.color} flex items-center justify-center text-white`}>
                                {layer.icon}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lowestLayer && lowestLayer.score < 50 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 flex items-start gap-2">
                      <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        Focus on <span className="font-semibold capitalize">{lowestLayer.name}</span> to improve balance
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/assessments"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <Target className="w-3.5 h-3.5" />
                      Take Assessment
                    </Link>
                    <Link
                      href="/daily-challenges"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Daily Challenge
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {isVisible && showNotificationIcon && !sticky && (
          <motion.div
            key="notification-icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Link
              href="/notifications"
              className="relative flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
