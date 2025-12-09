'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Flame, Zap, Trophy, Settings, ChevronRight, Camera, Grid3X3, Star, Lightbulb, MessageCircle, Heart } from 'lucide-react';
import { BadgesList, LevelDisplay } from '../../components/badges';
import { ActivityHeatmap } from '../../components/heatmap';
import ProfilePictureUpload from '@/components/media/ProfilePictureUpload';

type ContentTab = 'posts' | 'highlights' | 'insights';

interface Post {
  id: string;
  content: string;
  layer: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const contentTabs = [
    { id: 'posts' as ContentTab, label: 'Posts', icon: Grid3X3 },
    { id: 'highlights' as ContentTab, label: 'Highlights', icon: Star },
    { id: 'insights' as ContentTab, label: 'Insights', icon: Lightbulb },
  ];

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

  useEffect(() => {
    if (userId && activeTab === 'posts') {
      fetchUserPosts();
    }
  }, [userId, activeTab]);

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

  async function fetchUserPosts() {
    if (!userId) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?user_id=${userId}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Posts fetch error:', err);
    }
    setLoadingPosts(false);
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

  const layerColors: Record<string, string> = {
    environment: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    bio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    internal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    conscious: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    existential: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
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
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">About Me</h3>
              <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 mb-4">
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
            <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                {profile.credits || 0}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Credits</div>
            </div>
          </div>

          <LevelDisplay score={Number(profile.akorfaScore || 0)} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {contentTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {activeTab === 'posts' && (
              <div>
                {loadingPosts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="aspect-square bg-gray-100 dark:bg-slate-700 rounded-xl p-3 transition-all overflow-hidden group relative"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                          {post.content}
                        </p>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 dark:from-slate-700 to-transparent pt-8 pb-2 px-3">
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {post.likeCount ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> {post.commentCount ?? 0}
                            </span>
                          </div>
                        </div>
                        {post.layer && (
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs ${layerColors[post.layer] || 'bg-gray-100 text-gray-600'}`}>
                            {post.layer}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Grid3X3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No posts yet</p>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all"
                    >
                      Create Your First Post
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'highlights' && (
              <div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
                  <BadgesList userId={userId} />
                </div>
                <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Goals</h3>
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
            )}

            {activeTab === 'insights' && (
              <div>
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity Overview</h3>
                  <ActivityHeatmap userId={userId} />
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Your Growth Journey</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        You've earned {totalXp} XP and maintained a {streak}-day streak. 
                        Keep engaging to unlock new achievements!
                      </p>
                      <Link 
                        href="/assessments" 
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-2 hover:underline"
                      >
                        Take an assessment <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
