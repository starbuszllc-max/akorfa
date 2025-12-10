'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Zap, Trophy, TrendingUp, Target, Sparkles, ChevronRight } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import DailyFlow from '../../components/flow/DailyFlow';
import SavedRoutines from '../../components/routines/SavedRoutines';
import AccountabilityPods from '../../components/pods/AccountabilityPods';

interface Challenge {
  id: string;
  title: string;
  layer: string;
  pointsReward: number;
}

interface DashboardData {
  profile: any;
  recentAssessments: any[];
  activityCount: number;
  challengeStats: { total: number; completed: number };
  streakDays: number;
  challenges: Challenge[];
}

const layerNames = ['Environment', 'Biological', 'Internal', 'Cultural', 'Social', 'Conscious', 'Existential'];
const layerColors = ['green', 'blue', 'purple', 'orange', 'pink', 'indigo', 'red'] as const;

function calculateLevel(xp: number): { level: number; progress: number; xpForNext: number } {
  const baseXp = 100;
  const multiplier = 1.5;
  let level = 1;
  let totalXpNeeded = baseXp;
  
  while (xp >= totalXpNeeded) {
    level++;
    totalXpNeeded += Math.floor(baseXp * Math.pow(multiplier, level - 1));
  }
  
  const prevLevelXp = totalXpNeeded - Math.floor(baseXp * Math.pow(multiplier, level - 1));
  const xpForCurrentLevel = xp - prevLevelXp;
  const xpNeededForLevel = totalXpNeeded - prevLevelXp;
  
  return {
    level,
    progress: Math.min((xpForCurrentLevel / xpNeededForLevel) * 100, 100),
    xpForNext: xpNeededForLevel - xpForCurrentLevel
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    
    try {
      const uid = localStorage.getItem('demo_user_id');

      if (!uid) {
        setLoading(false);
        return;
      }

      setUserId(uid);

      const [profileRes, assessmentsRes, activityRes, challengesRes] = await Promise.all([
        fetch(`/api/profiles?user_id=${uid}`),
        fetch(`/api/assessments`),
        fetch(`/api/activity?user_id=${uid}`),
        fetch(`/api/challenges?user_id=${uid}`)
      ]);

      const [profileData, assessmentsData, activityData, challengesData] = await Promise.all([
        profileRes.json(),
        assessmentsRes.json(),
        activityRes.json(),
        challengesRes.json()
      ]);

      const userAssessments = (assessmentsData.assessments || []).filter(
        (a: any) => a.userId === uid
      );

      const activityArray = activityData.activity || [];

      const challengesList = (challengesData.challenges || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        layer: c.layer || 'social',
        pointsReward: c.pointsReward || c.points_reward || 50
      }));

      setData({
        profile: profileData.profile,
        recentAssessments: userAssessments.slice(0, 5),
        activityCount: activityArray.reduce((sum: number, a: any) => sum + (a.count || 0), 0),
        challengeStats: {
          total: challengesData.userParticipations?.length || 0,
          completed: challengesData.userParticipations?.filter((id: string) => 
            challengesData.challenges?.find((c: any) => c.id === id && c.status === 'completed')
          ).length || 0
        },
        streakDays: profileData.profile?.currentStreak || 0,
        challenges: challengesList
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Akorfa</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          Start your journey of self-discovery. Complete the onboarding to unlock your personalized dashboard.
        </p>
        <Link 
          href="/onboarding" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
        >
          Get Started
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  const akorfaScore = Number(data?.profile?.akorfaScore || 0);
  const layerScores = data?.profile?.layerScores || {};
  const totalXp = data?.profile?.totalXp || 0;
  const streak = data?.profile?.currentStreak || 0;
  const levelInfo = calculateLevel(totalXp);

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {data?.profile?.fullName || data?.profile?.username || 'Explorer'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Here&apos;s your growth journey overview</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full animate-pulse-success text-sm">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold">{streak} day streak!</span>
            </div>
          )}
          <Link 
            href="/coach"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-1.5 sm:gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            Talk to Coach
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {levelInfo.level}
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Level {levelInfo.level}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                {totalXp} XP
              </div>
            </div>
          </div>
          <Link href="/leaderboard" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline">
            <Trophy className="w-4 h-4" />
            View Leaderboard
          </Link>
        </div>
        <div className="relative h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${levelInfo.progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {levelInfo.xpForNext} XP to Level {levelInfo.level + 1}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Akorfa Score"
          value={akorfaScore.toFixed(0)}
          subtitle="Your growth index"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Assessments"
          value={data?.recentAssessments?.length || 0}
          subtitle="Completed"
          icon={<Target className="w-6 h-6" />}
        />
        <StatCard
          title="Challenges"
          value={`${data?.challengeStats?.completed || 0}/${data?.challengeStats?.total || 0}`}
          subtitle="Completed"
          icon={<Trophy className="w-6 h-6" />}
        />
        <StatCard
          title="Activity Streak"
          value={`${streak} days`}
          subtitle="Keep it going!"
          icon={<Flame className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <DailyFlow userId={userId} />
          <SavedRoutines userId={userId} availableChallenges={data?.challenges || []} />
          <AccountabilityPods userId={userId} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Layer Progress</h2>
            <Link href="/assessments" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Take Assessment
            </Link>
          </div>
          <div className="space-y-4">
            {layerNames.map((layer, index) => {
              const key = layer.toLowerCase();
              const score = layerScores[key] || 0;
              return (
                <ProgressBar
                  key={layer}
                  label={layer}
                  value={Number(score)}
                  max={10}
                  color={layerColors[index] as any || 'indigo'}
                  size="md"
                />
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/insights"
              className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Daily Insights</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">AI-powered guidance</div>
            </Link>
            <Link 
              href="/groups"
              className="p-4 bg-pink-50 dark:bg-pink-900/30 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
            >
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="font-medium text-gray-900 dark:text-white">Communities</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Join growth groups</div>
            </Link>
            <Link 
              href="/challenges"
              className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              <Trophy className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Challenges</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Earn XP & grow</div>
            </Link>
            <Link 
              href="/leaderboard"
              className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Leaderboard</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">See top performers</div>
            </Link>
          </div>
        </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Ready to grow?</h3>
            <p className="text-indigo-100">Join a challenge and earn XP while developing new skills.</p>
          </div>
          <Link 
            href="/challenges"
            className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Browse Challenges
          </Link>
        </div>
      </div>
    </div>
  );
}
