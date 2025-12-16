'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Flame, Zap, Trophy, Settings, ChevronRight, Camera, Grid3X3, Star, Lightbulb, MessageCircle, Heart, Users, X } from 'lucide-react';
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
  mediaUrls?: string[];
  mediaTypes?: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
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
    fetchFollowCounts(uid);
  }, []);

  async function fetchFollowCounts(uid: string) {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follows?userId=${uid}&type=followers`),
        fetch(`/api/follows?userId=${uid}&type=following`)
      ]);
      if (followersRes.ok) {
        const data = await followersRes.json();
        setFollowerCount(data.count || 0);
      }
      if (followingRes.ok) {
        const data = await followingRes.json();
        setFollowingCount(data.count || 0);
      }
    } catch (err) {
      console.error('Follow counts fetch error:', err);
    }
  }

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
    setPostsLoaded(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Sign up to create your profile and start tracking your growth.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
        >
          Get Started
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!profile || (postsLoaded && posts.length === 0)) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-purple-100 dark:from-green-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-dashed border-green-300 dark:border-green-600 rounded-full animate-spin-slow" style={{ animationDuration: '8s' }}></div>
            </div>
            <User className="w-10 h-10 text-green-400 dark:text-green-500" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Locked
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Your Profile is Locked
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Make your first post to unlock your profile and start your journey!
        </p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-purple-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-purple-700 transition-all shadow-lg shadow-green-500/25"
        >
          <Zap className="w-5 h-5" />
          Make Your First Post
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const totalXp = profile.totalXp || 0;
  const streak = profile.currentStreak || 0;
  const level = profile.level || 1;

  const layerColors: Record<string, string> = {
    environment: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    bio: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    internal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    conscious: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    existential: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  };

  return (
    <div className="w-full space-y-0 pb-24 pt-0">
      <div className="w-full overflow-hidden">
        <div className="relative h-40 sm:h-48">
          {profile.coverUrl ? (
            <img 
              src={profile.coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-500 via-purple-500 to-pink-500"></div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
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
          <div className="flex items-end gap-4 -mt-16 mb-5">
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
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
            </div>
            <Link
              href="/profile/settings"
              className="pb-1 flex items-center justify-center w-11 h-11 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-600 rounded-full text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:from-green-50 hover:to-green-50 dark:hover:from-green-900/40 dark:hover:to-green-900/40 transition-all"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {profile.bio && (
            <div className="p-4 mb-4 bg-transparent">
              <p className="text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-green-700 dark:text-green-300">
                <Zap className="w-3 h-3" />
                {totalXp}
              </div>
              <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5 text-center">XP</div>
            </div>
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-green-700 dark:text-green-300">
                <Trophy className="w-3 h-3" />
                {level}
              </div>
              <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5 text-center">Level</div>
            </div>
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-orange-700 dark:text-orange-300">
                <Flame className="w-3 h-3" />
                {streak}
              </div>
              <div className="text-[10px] text-orange-600 dark:text-orange-400 font-medium mt-0.5 text-center">Streak</div>
            </div>
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-blue-700 dark:text-blue-300">
                <Users className="w-3 h-3" />
                {followerCount}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 text-center">Followers</div>
            </div>
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-purple-700 dark:text-purple-300">
                <Users className="w-3 h-3" />
                {followingCount}
              </div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mt-0.5 text-center">Following</div>
            </div>
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                {profile.credits || 0}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 text-center">Credits</div>
            </div>
          </div>

          <LevelDisplay score={Number(profile.akorfaScore || 0)} />
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className="flex bg-transparent">
          {contentTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-green-600 dark:text-green-400 bg-white dark:bg-slate-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-purple-600 dark:from-green-400 dark:to-purple-400"
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
            className="p-6"
          >
            {activeTab === 'posts' && (
              <div>
                {loadingPosts ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
                  </div>
                ) : posts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {posts.map((post) => {
                        const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
                        const firstMedia = hasMedia ? post.mediaUrls![0] : null;
                        const firstMediaType = post.mediaTypes && post.mediaTypes.length > 0 ? post.mediaTypes[0] : null;
                        const isVideo = firstMediaType === 'video' || (firstMedia && (firstMedia.includes('.mp4') || firstMedia.includes('.webm') || firstMedia.includes('.mov')));
                        
                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedPost(post)}
                            className="aspect-square bg-gray-100 dark:bg-slate-700 overflow-hidden relative group cursor-pointer rounded-lg"
                          >
                          {hasMedia && firstMedia ? (
                            isVideo ? (
                              <video
                                src={firstMedia}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={firstMedia}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-3 bg-gradient-to-br from-gray-200 dark:from-slate-600 to-gray-300 dark:to-slate-700">
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 text-center font-medium">
                                {post.content}
                              </p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs">
                            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg">
                              <Heart className="w-3 h-3 fill-white" /> {post.likeCount ?? 0}
                            </span>
                            <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg">
                              <MessageCircle className="w-3 h-3 fill-white" /> {post.commentCount ?? 0}
                            </span>
                          </div>
                          {isVideo && (
                            <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg text-white">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )}
                          {post.mediaUrls && post.mediaUrls.length > 1 && (
                            <div className="absolute top-2 left-2 bg-black/50 p-1.5 rounded-lg text-white">
                              <Grid3X3 className="w-4 h-4" />
                            </div>
                          )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {selectedPost && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPost(null)}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                      >
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.9 }}
                          onClick={(e) => e.stopPropagation()}
                          className="relative max-w-2xl max-h-[90vh] w-full flex flex-col"
                        >
                          {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 ? (
                            selectedPost.mediaTypes?.[0] === 'video' || selectedPost.mediaUrls[0].includes('.mp4') ? (
                              <video
                                src={selectedPost.mediaUrls[0]}
                                className="w-full h-full object-contain rounded-lg"
                                controls
                                autoPlay
                                playsInline
                              />
                            ) : (
                              <img
                                src={selectedPost.mediaUrls[0]}
                                alt=""
                                className="w-full h-full object-contain rounded-lg"
                              />
                            )
                          ) : (
                            <div className="w-full aspect-square bg-gradient-to-br from-gray-200 dark:from-slate-600 to-gray-300 dark:to-slate-700 rounded-lg flex items-center justify-center p-6">
                              <p className="text-gray-600 dark:text-gray-300 text-center font-medium text-lg">
                                {selectedPost.content}
                              </p>
                            </div>
                          )}
                          
                          <button
                            onClick={() => setSelectedPost(null)}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <Grid3X3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">No posts yet</p>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-purple-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-purple-700 transition-all shadow-lg shadow-green-500/20"
                    >
                      Create Your First Post
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'highlights' && (
              <div className="space-y-5">
                <div className="p-5 bg-transparent">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Achievements</h3>
                  <BadgesList userId={userId} />
                </div>
                <div className="p-5 bg-transparent">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Goals</h3>
                  {profile.goals && profile.goals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.goals.map((goal: string, i: number) => (
                        <span key={i} className="px-3 py-2 bg-gradient-to-r from-green-100 to-purple-100 dark:from-green-900/40 dark:to-purple-900/40 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-800/50">
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
              <div className="space-y-5">
                <div className="p-5 bg-transparent">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Activity Overview</h3>
                  <ActivityHeatmap userId={userId} />
                </div>
                <div className="bg-transparent p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-purple-100 dark:from-green-800/50 dark:to-purple-800/50 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base">Your Growth Journey</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        You've earned <span className="font-semibold text-green-600 dark:text-green-400">{totalXp} XP</span> and maintained a <span className="font-semibold text-orange-600 dark:text-orange-400">{streak}-day streak</span>. 
                        Keep engaging to unlock new achievements!
                      </p>
                      <Link 
                        href="/assessments" 
                        className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mt-3 hover:text-green-700 dark:hover:text-green-300 transition-colors"
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
