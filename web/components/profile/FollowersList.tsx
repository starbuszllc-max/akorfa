'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus } from 'lucide-react';
import Link from 'next/link';

interface Follower {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  level: number;
  akorfaScore: number;
}

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
  isPublicProfile?: boolean;
}

export default function FollowersList({
  userId,
  type,
  isOpen,
  onClose,
  currentUserId,
  isPublicProfile = false
}: FollowersListProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen, userId, type]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/follows?userId=${userId}&type=${type}&detailed=true`);
      if (res.ok) {
        let data = await res.json();
        let users = data.users || [];

        // On public profiles, filter to only show mutual followers with public status
        if (isPublicProfile && type === 'followers') {
          users = users.filter((u: any) => 
            u.isMutual && u.isPublic
          );
        }

        setFollowers(users);

        // Check follow status for each user
        if (currentUserId) {
          const followingSet = new Set<string>();
          for (const user of users) {
            try {
              const followRes = await fetch(
                `/api/follows?follower_id=${currentUserId}&following_id=${user.id}`
              );
              if (followRes.ok) {
                const followData = await followRes.json();
                if (followData.isFollowing) {
                  followingSet.add(user.id);
                }
              }
            } catch (err) {
              console.error(`Error checking follow status for ${user.id}:`, err);
            }
          }
          setFollowing(followingSet);
        }
      }
    } catch (err) {
      console.error('Failed to fetch followers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowClick = async (targetUserId: string) => {
    if (!currentUserId) return;

    const isFollowing = following.has(targetUserId);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: targetUserId,
          ...(isFollowing && { action: 'unfollow' })
        })
      });

      if (res.ok) {
        const newFollowing = new Set(following);
        if (isFollowing) {
          newFollowing.delete(targetUserId);
        } else {
          newFollowing.add(targetUserId);
        }
        setFollowing(newFollowing);
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {type}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : followers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isPublicProfile && type === 'followers'
                      ? 'No public mutual followers yet'
                      : `No ${type} yet`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {followers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex-1 flex items-center gap-3 min-w-0"
                      >
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-purple-500 flex items-center justify-center overflow-hidden">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {user.fullName || user.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span>Lvl {user.level}</span>
                            <span>•</span>
                            <span>{Math.round(user.akorfaScore)} pts</span>
                          </div>
                        </div>
                      </Link>

                      {currentUserId && currentUserId !== user.id && (
                        <button
                          onClick={() => handleFollowClick(user.id)}
                          className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                            following.has(user.id)
                              ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          }`}
                        >
                          {following.has(user.id) ? (
                            <UserMinus className="w-4 h-4" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
