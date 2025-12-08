'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { User, Flame, Zap, Trophy, Settings, ChevronRight, Camera } from 'lucide-react';
import { BadgesList, LevelDisplay } from '../../components/badges';
import { ActivityHeatmap } from '../../components/heatmap';
import ProfilePictureUpload from '@/components/media/ProfilePictureUpload';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'media');
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, cover_url: url })
        });
        setProfile({ ...profile, coverUrl: url });
      }
    } catch (err) {
      console.error('Cover upload error:', err);
    } finally {
      setUploadingCover(false);
    }
  }

  useEffect(() => {
    const uid = localStorage.getItem('demo_user_id');
    setUserId(uid);
    
    if (!uid) {
      setLoading(false);
      return;
    }

    fetchProfile(uid);
  }, []);

  async function fetchProfile(uid: string) {
    try {
      const res = await fetch(`/api/profiles?user_id=${uid}`);
      const data = await res.json();
      if (data.profile && !data.error) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Complete onboarding to create your profile and start tracking your growth.
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

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-gray-600 dark:text-gray-300 mb-4">Profile not found.</p>
        <Link href="/onboarding" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Complete Onboarding
        </Link>
      </div>
    );
  }

  const totalXp = profile.totalXp || 0;
  const streak = profile.currentStreak || 0;
  const level = profile.level || 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="relative h-32 md:h-40">
          {profile.coverUrl ? (
            <img 
              src={profile.coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            {uploadingCover ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <ProfilePictureUpload
              currentUrl={profile.avatarUrl}
              onUpload={async (url) => {
                try {
                  await fetch('/api/profiles', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, avatar_url: url })
                  });
                  setProfile({ ...profile, avatarUrl: url });
                } catch (err) {
                  console.error('Failed to update avatar:', err);
                }
              }}
              size="lg"
            />
            <div className="pb-2 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
            </div>
            <Link
              href="/profile/settings"
              className="pb-2 flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>

          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Zap className="w-5 h-5 text-indigo-500" />
                {totalXp}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">XP</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Trophy className="w-5 h-5 text-amber-500" />
                {level}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Level</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Flame className="w-5 h-5 text-orange-500" />
                {streak}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Streak</div>
            </div>
          </div>

          <LevelDisplay score={Number(profile.akorfaScore || 0)} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity</h2>
        <ActivityHeatmap userId={userId} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
        <BadgesList userId={userId} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goals</h2>
        {profile.goals && profile.goals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((goal: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                {goal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No goals set yet.</p>
        )}
      </div>
    </div>
  );
}
