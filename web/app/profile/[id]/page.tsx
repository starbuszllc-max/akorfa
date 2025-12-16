'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Flame, Zap, Trophy, ArrowLeft, UserPlus, UserMinus, MessageCircle, Users, Grid3X3, Heart, X } from 'lucide-react';
import { BadgesList, LevelDisplay } from '../../../components/badges';
import { ActivityHeatmap } from '../../../components/heatmap';

interface ProfileData {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  akorfaScore: number;
  level: number;
  totalXp: number;
  currentStreak: number;
  goals: string[];
}

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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentUserId] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const isOwnProfile = currentUserId === profileId;

  const layerColors: Record<string, string> = {
    environment: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    bio: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    internal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    conscious: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    existential: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  };

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchFollowCounts();
      fetchUserPosts();
      if (currentUserId && currentUserId !== profileId) {
        checkFollowStatus();
      }
    }
  }, [profileId, currentUserId]);

  async function fetchFollowCounts() {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follows?userId=${profileId}&type=followers`),
        fetch(`/api/follows?userId=${profileId}&type=following`)
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

  async function fetchUserPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?user_id=${profileId}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Posts fetch error:', err);
    }
    setLoadingPosts(false);
  }

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/profiles?user_id=${profileId}`);
      const data = await res.json();
      if (data.profile && !data.error) {
        setProfile({
          id: data.profile.id,
          username: data.profile.username,
          fullName: data.profile.fullName,
          avatarUrl: data.profile.avatarUrl,
          coverUrl: data.profile.coverUrl,
          bio: data.profile.bio,
          akorfaScore: data.profile.akorfaScore || 0,
          level: data.profile.level || 1,
          totalXp: data.profile.totalXp || 0,
          currentStreak: data.profile.currentStreak || 0,
          goals: data.profile.goals || [],
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
    setLoading(false);
  }

  async function checkFollowStatus() {
    try {
      const res = await fetch(`/api/follows?follower_id=${currentUserId}&following_id=${profileId}`);
      const data = await res.json();
      setIsFollowing(data.isFollowing || false);
    } catch (err) {
      console.error('Check follow error:', err);
    }
  }

  async function handleFollow() {
    if (!currentUserId) return;
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followingId: profileId }),
      });
      if (res.ok) {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  }

  async function handleUnfollow() {
    if (!currentUserId) return;
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followingId: profileId, action: 'unfollow' }),
      });
      if (res.ok) {
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Unfollow error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          User not found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This user doesn't exist or their profile is not available.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

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
            onClick={() => router.back()}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-4 -mt-16 mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden bg-gradient-to-br from-purple-500 to-green-600 flex items-center justify-center shrink-0 shadow-lg relative z-10">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl text-white font-bold">
                  {(profile.fullName || profile.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
            </div>
          </div>
          
          {!isOwnProfile && currentUserId && (
            <div className="flex gap-2 mb-5">
              {isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                >
                  <UserMinus className="w-4 h-4" />
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-600 transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              )}
              <button
                onClick={() => router.push(`/messages?user=${profileId}`)}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {isOwnProfile && (
            <Link
              href="/profile"
              className="block w-full text-center px-3 py-2.5 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-all mb-5"
            >
              Edit Profile
            </Link>
          )}

          {profile.bio && (
            <div className="p-4 mb-4 bg-transparent">
              <p className="text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-green-700 dark:text-green-300">
                <Trophy className="w-3 h-3" />
                {profile.level}
              </div>
              <div className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5 text-center">Level</div>
            </div>
            <div className="p-1.5 bg-transparent">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-orange-700 dark:text-orange-300">
                <Flame className="w-3 h-3" />
                {profile.currentStreak}
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
          </div>

          {isOwnProfile && <LevelDisplay score={Number(profile.akorfaScore || 0)} />}
        </div>
      </div>

      <div className="w-full px-6 mt-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity</h2>
        <ActivityHeatmap userId={profileId} />
      </div>

      <div className="w-full px-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5" />
          Posts
        </h2>
        {loadingPosts ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square bg-gray-100 dark:bg-slate-700 overflow-hidden relative group cursor-pointer"
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
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 text-center">
                        {post.content}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" /> {post.likeCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white" /> {post.commentCount ?? 0}
                    </span>
                  </div>
                  {isVideo && (
                    <div className="absolute top-2 right-2 text-white">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                  {post.mediaUrls && post.mediaUrls.length > 1 && (
                    <div className="absolute top-2 right-2 text-white">
                      <Grid3X3 className="w-4 h-4" />
                    </div>
                  )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
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
                    {selectedPost.content && selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                      <div className="text-white text-sm md:text-base mb-3 p-3 bg-black/40 rounded-lg backdrop-blur-md">
                        {selectedPost.content}
                      </div>
                    )}
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
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center py-8">
            <Grid3X3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
          </div>
        )}
      </div>

      <div className="w-full px-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
        <BadgesList userId={profileId} />
      </div>

      {profile.goals && profile.goals.length > 0 && (
        <div className="w-full px-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goals</h2>
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((goal: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm">
                {goal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
