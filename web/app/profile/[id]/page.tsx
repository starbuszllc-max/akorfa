'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Flame, Zap, Trophy, ArrowLeft, UserPlus, UserMinus, MessageCircle, Users, Grid3X3, Heart } from 'lucide-react';
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
  const isOwnProfile = currentUserId === profileId;

  const layerColors: Record<string, string> = {
    environment: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    bio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    internal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    conscious: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="h-28 sm:h-36 relative">
          {profile.coverUrl ? (
            <img 
              src={profile.coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-slate-700 overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl text-white font-bold">
                    {(profile.fullName || profile.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="pb-2 flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {profile.fullName || profile.username}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base truncate">@{profile.username}</p>
              </div>
            </div>
            
            {!isOwnProfile && currentUserId && (
              <div className="flex gap-2 flex-wrap">
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <UserMinus className="w-4 h-4" />
                    Unfollow
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </button>
                )}
                <button
                  onClick={() => router.push(`/messages?user=${profileId}`)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {isOwnProfile && (
              <Link
                href="/profile"
                className="px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Zap className="w-5 h-5 text-indigo-500" />
                {profile.totalXp}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">XP</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Trophy className="w-5 h-5 text-amber-500" />
                {profile.level}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Level</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Flame className="w-5 h-5 text-orange-500" />
                {profile.currentStreak}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Streak</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Users className="w-5 h-5 text-blue-500" />
                {followerCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-white">
                <Users className="w-5 h-5 text-purple-500" />
                {followingCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
            </div>
          </div>

          <LevelDisplay score={Number(profile.akorfaScore || 0)} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity</h2>
        <ActivityHeatmap userId={profileId} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5" />
          Posts
        </h2>
        {loadingPosts ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => {
              const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
              const firstMedia = hasMedia ? post.mediaUrls![0] : null;
              const firstMediaType = post.mediaTypes && post.mediaTypes.length > 0 ? post.mediaTypes[0] : null;
              const isVideo = firstMediaType === 'video' || (firstMedia && (firstMedia.includes('.mp4') || firstMedia.includes('.webm') || firstMedia.includes('.mov')));
              
              return (
                <div
                  key={post.id}
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
        ) : (
          <div className="text-center py-8">
            <Grid3X3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
        <BadgesList userId={profileId} />
      </div>

      {profile.goals && profile.goals.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goals</h2>
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((goal: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                {goal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
