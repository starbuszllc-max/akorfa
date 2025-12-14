'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string | null;
  size?: 'sm' | 'md';
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  targetUserId, 
  currentUserId, 
  size = 'md',
  onFollowChange 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      checkFollowStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(`/api/follow?userId=${currentUserId}&type=following`);
      if (!res.ok) {
        console.error('Follow status check failed:', res.status);
        setCheckingStatus(false);
        return;
      }
      const data = await res.json();
      const isFollowingUser = data.following?.some((f: any) => f.id === targetUserId);
      setIsFollowing(isFollowingUser || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || loading) return;
    
    setLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch('/api/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: targetUserId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Follow action failed:', error);
        return;
      }

      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);
      onFollowChange?.(newFollowingState);
    } catch (error) {
      console.error('Follow action error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  if (checkingStatus) {
    return (
      <button
        disabled
        className={`flex items-center gap-1.5 rounded-full font-medium ${
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        } bg-gray-100 dark:bg-slate-700 text-gray-400`}
      >
        <Loader2 className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full font-medium transition-all ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${
        isFollowing
          ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
      ) : isFollowing ? (
        <>
          <UserCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
          Following
        </>
      ) : (
        <>
          <UserPlus className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
          Follow
        </>
      )}
    </button>
  );
}
