'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabaseClient';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';

interface DashboardData {
  profile: any;
  recentAssessments: any[];
  activityCount: number;
  challengeStats: { total: number; completed: number };
  streakDays: number;
}

const layerNames = ['Environment', 'Biological', 'Internal', 'Cultural', 'Social', 'Conscious', 'Existential'];
const layerColors = ['green', 'blue', 'purple', 'orange', 'pink', 'indigo', 'red'] as const;

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
      let uid: string | null = localStorage.getItem('demo_user_id');
      
      if (!uid) {
        const client = supabaseClient();
        const { data: session } = await client.auth.getSession();
        uid = session?.session?.user?.id || null;
      }

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
      const streakDays = calculateStreakFromActivity(activityArray);

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
        streakDays
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  function calculateStreakFromActivity(activity: any[]): number {
    if (!activity.length) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activityDates = activity.map(a => {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }).filter(d => !isNaN(d));
    
    const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a);
    
    let streak = 0;
    let checkDate = today.getTime();
    
    for (const date of uniqueDates) {
      if (date === checkDate || date === checkDate - 86400000) {
        streak++;
        checkDate = date;
      } else {
        break;
      }
    }
    
    return streak;
  }

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Akorfa</h1>
          <p className="text-gray-600 mb-6">Sign in to access your personal dashboard and track your growth journey.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  }

  const akorfaScore = Number(data?.profile?.akorfaScore || 0);
  const layerScores = data?.profile?.layerScores || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {data?.profile?.fullName || data?.profile?.username || 'Explorer'}
          </h1>
          <p className="text-gray-500 mt-1">Here's your growth journey overview</p>
        </div>
        <Link 
          href="/coach"
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Talk to Coach
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Akorfa Score"
          value={akorfaScore.toFixed(0)}
          subtitle="Your growth index"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          title="Assessments"
          value={data?.recentAssessments?.length || 0}
          subtitle="Completed"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          title="Challenges"
          value={`${data?.challengeStats?.completed || 0}/${data?.challengeStats?.total || 0}`}
          subtitle="Completed"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          title="Activity Streak"
          value={`${data?.streakDays || 0} days`}
          subtitle="Keep it going!"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Layer Progress</h2>
            <Link href="/assessments" className="text-sm text-indigo-600 hover:text-indigo-700">
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

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/feed" className="text-sm text-indigo-600 hover:text-indigo-700">
              View Feed
            </Link>
          </div>
          {data?.recentAssessments && data.recentAssessments.length > 0 ? (
            <div className="space-y-3">
              {data.recentAssessments.map((assessment: any, index: number) => (
                <div key={assessment.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Assessment Completed</p>
                    <p className="text-sm text-gray-500">
                      Score: {Number(assessment.overallScore || 0).toFixed(1)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(assessment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No assessments yet</p>
              <Link 
                href="/assessments"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Take Your First Assessment
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Ready to grow?</h3>
            <p className="text-indigo-100">Join a challenge and earn points while developing new skills.</p>
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
