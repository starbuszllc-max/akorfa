'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, UserPlus, UserMinus, MessageCircle, Users, Flame, Trophy, Eye } from 'lucide-react';

interface ProfilePreviewPopupProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

interface ProfileData {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  currentStreak: number;
}

export default function ProfilePreviewPopup({
  userId,
  username,
  avatarUrl,
  isOpen,
  onClose,
  currentUserId
}: ProfilePreviewPopupProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
      fetchFollowCounts();
      if (currentUserId && currentUserId !== userId) {
        checkFollowStatus();
      }
    }
  }, [isOpen, userId, currentUserId]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles?user_id=${userId}`);
      const data = await res.json();
      if (data.profile && !data.error) {
        setProfile({
          id: data.profile.id,
          username: data.profile.username,
          fullName: data.profile.fullName,
          avatarUrl: data.profile.avatarUrl,
          bio: data.profile.bio,
          level: data.profile.level || 1,
          currentStreak: data.profile.currentStreak || 0,
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
    setLoading(false);
  }

  async function fetchFollowCounts() {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follows?userId=${userId}&type=followers`),
        fetch(`/api/follows?userId=${userId}&type=following`)
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

  async function checkFollowStatus() {
    try {
      const res = await fetch(`/api/follows?follower_id=${currentUserId}&following_id=${userId}`);
      const data = await res.json();
      setIsFollowing(data.isFollowing || false);
    } catch (err) {
      console.error('Check follow error:', err);
    }
  }

  async function handleFollow() {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followingId: userId }),
      });
      if (res.ok) {
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
    setFollowLoading(false);
  }

  async function handleUnfollow() {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followingId: userId, action: 'unfollow' }),
      });
      if (res.ok) {
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Unfollow error:', err);
    }
    setFollowLoading(false);
  }

  function handleViewProfile() {
    onClose();
    router.push(`/profile/${userId}`);
  }

  function handleMessage() {
    onClose();
    router.push(`/messages?user=${userId}`);
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-24 bg-gradient-to-r from-green-500 via-purple-500 to-pink-500 relative">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden bg-gradient-to-br from-purple-500 to-green-600 flex items-center justify-center shadow-lg">
                  {profile?.avatarUrl || avatarUrl ? (
                    <img src={profile?.avatarUrl || avatarUrl!} alt={username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-white font-bold">
                      {(profile?.fullName || username || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-12 px-5 pb-5">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {profile?.fullName || username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{profile?.username || username}</p>
                  </div>

                  {profile?.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  <div className="grid grid-cols-4 gap-2 mb-5">
                    <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{followerCount}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Followers</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{followingCount}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Following</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3 text-green-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{profile?.level || 1}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Level</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{profile?.currentStreak || 0}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Streak</p>
                    </div>
                  </div>

                  {!isOwnProfile && currentUserId && (
                    <div className="flex gap-2 mb-4">
                      {isFollowing ? (
                        <button
                          onClick={handleUnfollow}
                          disabled={followLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                        >
                          <UserMinus className="w-4 h-4" />
                          {followLoading ? 'Loading...' : 'Unfollow'}
                        </button>
                      ) : (
                        <button
                          onClick={handleFollow}
                          disabled={followLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-600 transition-all shadow-md disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" />
                          {followLoading ? 'Loading...' : 'Follow'}
                        </button>
                      )}
                      <button
                        onClick={handleMessage}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleViewProfile}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
