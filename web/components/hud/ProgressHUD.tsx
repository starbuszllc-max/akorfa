'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, TrendingUp, Zap, Target, Brain, Heart, Users, Leaf, Sparkles } from 'lucide-react';

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
  const [expanded, setExpanded] = useState(true);
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
    setExpanded(true);
    setShowNotificationIcon(false);
    
    const collapseTimer = setTimeout(() => {
      setExpanded(false);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShowHUD(false);
      setTimeout(() => {
        setShowNotificationIcon(true);
      }, 300);
    }, 5000);

    return () => {
      clearTimeout(collapseTimer);
      clearTimeout(hideTimer);
    };
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

  const handleNotificationClick = () => {
    setShowNotificationIcon(false);
    setShowHUD(true);
    setExpanded(true);
  };

  const positionClasses = sticky 
    ? "sticky top-0 z-40 mb-4" 
    : "fixed top-16 right-4 z-40";

  return (
    <div className={positionClasses}>
      <AnimatePresence mode="wait">
        {isVisible && showHUD && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.div
              layout
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden w-16"
            >
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex flex-col items-center gap-1 px-2 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white/50 dark:ring-slate-900/50">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  {streak > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800">
                      <Flame className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="font-bold text-base text-indigo-600 dark:text-indigo-400">
                    {loading ? '...' : Math.round(aKorfaScore)}
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Score</div>
                </div>
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100/50 dark:border-slate-700/50"
                  >
                    <div className="py-2 px-2 space-y-2">
                      <div className="flex flex-col items-center gap-1 py-1.5 px-1 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <div className="text-center">
                          <div className="font-bold text-sm text-orange-600 dark:text-orange-400">{streak}</div>
                          <div className="text-[8px] text-orange-500/70 dark:text-orange-400/70 uppercase">days</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1 py-1.5 px-1 bg-green-50/80 dark:bg-green-900/20 rounded-xl">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <div className="text-center">
                          <div className="font-bold text-sm text-green-600 dark:text-green-400">{averageLayerScore}%</div>
                          <div className="text-[8px] text-green-500/70 dark:text-green-400/70 uppercase">balance</div>
                        </div>
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
            <button
              onClick={handleNotificationClick}
              className="relative flex items-center justify-center w-12 h-12 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex flex-col items-center">
                <Star className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{Math.round(aKorfaScore)}</span>
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
