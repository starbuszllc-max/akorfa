'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LayeredLikeIcon from '@/components/ui/icons/LayeredLikeIcon';

interface Comment {
  id: string;
  postId: string;
  userId: string | null;
  content: string;
  createdAt: string;
  parentId?: string | null;
  profiles: {
    username: string | null;
    avatarUrl: string | null;
  } | null;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
}

interface PostProps {
  post: {
    id: string;
    user_id: string | null;
    content: string;
    layer: string;
    like_count: number;
    comment_count: number;
    created_at: string;
    profiles: {
      username: string | null;
      avatar_url: string | null;
    } | null;
    badges?: Badge[];
  };
  currentUserId: string | null;
  onLike?: (postId: string) => void;
  onCommentAdded?: (postId: string) => void;
}

const layerColors: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
  environment: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-400', gradient: 'from-emerald-400 to-teal-500' },
  bio: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', ring: 'ring-rose-400', gradient: 'from-rose-400 to-pink-500' },
  internal: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-400', gradient: 'from-purple-400 to-violet-500' },
  cultural: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-400', gradient: 'from-amber-400 to-orange-500' },
  social: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-400', gradient: 'from-blue-400 to-cyan-500' },
  conscious: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', ring: 'ring-indigo-400', gradient: 'from-indigo-400 to-blue-500' },
  existential: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', ring: 'ring-violet-400', gradient: 'from-violet-400 to-purple-500' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatExactTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function EnhancedPostCard({ post, currentUserId, onLike, onCommentAdded }: PostProps) {
  const router = useRouter();
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState('Link copied to clipboard!');
  const [showShareModal, setShowShareModal] = useState(false);

  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url;
  const layerStyle = layerColors[post.layer] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', ring: 'ring-gray-400', gradient: 'from-gray-400 to-gray-500' };

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const resp = await fetch(`/api/comments?post_id=${post.id}`);
      const data = await resp.json();
      if (resp.ok && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  async function toggleComments() {
    if (!showComments) {
      await fetchComments();
    }
    setShowComments(!showComments);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const resp = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_id: replyingTo?.id || null
        })
      });

      if (resp.ok) {
        setNewComment('');
        setReplyingTo(null);
        setLocalCommentCount(prev => prev + 1);
        await fetchComments();
        onCommentAdded?.(post.id);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  }

  function handleReply(comment: Comment) {
    setReplyingTo({ id: comment.id, username: comment.profiles?.username || 'Anonymous' });
    setNewComment(`@${comment.profiles?.username || 'Anonymous'} `);
  }

  function navigateToProfile(userId: string | null) {
    if (userId) {
      router.push(`/profile/${userId}`);
    }
  }

  async function handleLike() {
    if (!currentUserId || isLiking || hasLiked) return;
    
    setIsLiking(true);
    setShowHeartAnimation(true);
    
    try {
      const resp = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          user_id: currentUserId,
          reaction_type: 'like'
        })
      });

      if (resp.ok) {
        setHasLiked(true);
        setLocalLikeCount(prev => prev + 1);
        onLike?.(post.id);
      } else {
        const error = await resp.json();
        if (error.error?.includes('duplicate') || error.error?.includes('unique')) {
          setHasLiked(true);
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    } finally {
      setIsLiking(false);
      setTimeout(() => setShowHeartAnimation(false), 600);
    }
  }

  function handleShare() {
    setShowShareModal(true);
  }

  async function handleShareOption(option: 'feed' | 'story' | 'community' | 'external' | 'copy') {
    setShowShareModal(false);
    
    if (option === 'feed' || option === 'story' || option === 'community') {
      setShareToastMessage('Coming soon! Use Copy Link for now.');
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
      return;
    } else if (option === 'external') {
      try {
        const shareUrl = `${window.location.origin}/feed#post-${post.id}`;
        if (navigator.share) {
          await navigator.share({
            title: 'Check out this post on Akorfa',
            text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
            url: shareUrl
          });
        }
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else if (option === 'copy') {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/feed#post-${post.id}`);
        setShareToastMessage('Link copied to clipboard!');
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  }

  return (
    <motion.article
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="px-3 py-4 md:p-5 transition-all duration-200"
    >
      {showShareToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg text-sm font-medium"
        >
          {shareToastMessage}
        </motion.div>
      )}

      <AnimatePresence>
        {showShareModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-3xl shadow-xl p-6 pb-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Share post</h3>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => handleShareOption('feed')}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-colors relative"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Feed</span>
                  <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-full font-medium">Soon</span>
                </button>
                <button
                  onClick={() => handleShareOption('story')}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-colors relative"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Story</span>
                  <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-full font-medium">Soon</span>
                </button>
                <button
                  onClick={() => handleShareOption('community')}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-colors relative"
                >
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Community</span>
                  <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 rounded-full font-medium">Soon</span>
                </button>
                <button
                  onClick={() => handleShareOption('copy')}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Copy</span>
                </button>
              </div>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={() => handleShareOption('external')}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share to Other Apps
                </button>
              )}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className={`relative p-0.5 rounded-full bg-gradient-to-br ${layerStyle.gradient} cursor-pointer`}
            onClick={() => navigateToProfile(post.user_id)}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={username} 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium ring-2 ring-white dark:ring-slate-800">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div 
              className="font-semibold text-gray-900 dark:text-white text-sm cursor-pointer hover:underline"
              onClick={() => navigateToProfile(post.user_id)}
            >
              {username}
            </div>
            <div 
              className="relative"
              onMouseEnter={() => setShowTimeTooltip(true)}
              onMouseLeave={() => setShowTimeTooltip(false)}
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 cursor-help">
                {formatTimeAgo(post.created_at)}
              </span>
              <AnimatePresence>
                {showTimeTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 top-5 z-10 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap"
                  >
                    {formatExactTime(post.created_at)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className={`px-3 py-1 text-xs font-medium rounded-full ${layerStyle.bg} ${layerStyle.text} capitalize`}
        >
          {post.layer}
        </motion.span>
      </div>

      {post.badges && post.badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.badges.map((badge) => (
            <span 
              key={badge.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium"
            >
              <span>{badge.icon}</span>
              <span>{badge.name}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent opacity-50" />
        <p className="pl-3 text-gray-800 dark:text-gray-200 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      <div className="mt-1 pt-2 border-b border-gray-200 dark:border-slate-700/50 flex items-center gap-4 pb-3">
        <motion.button 
          onClick={handleLike}
          disabled={!currentUserId || isLiking || hasLiked}
          whileTap={{ scale: 0.9 }}
          className={`relative flex items-center gap-1.5 text-sm transition-colors ${
            hasLiked 
              ? 'like-button-active cursor-default' 
              : currentUserId 
                ? 'text-gray-500 dark:text-gray-400 hover:text-red-500' 
                : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <AnimatePresence>
            {showHeartAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-rose-500 fill-current" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="w-5 h-5"
            animate={hasLiked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <LayeredLikeIcon isActive={hasLiked} className="w-5 h-5" />
          </motion.div>
          <span className={hasLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}>{localLikeCount}</span>
        </motion.button>

        <motion.button 
          onClick={toggleComments}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            showComments ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{localCommentCount}</span>
        </motion.button>

        <motion.button
          onClick={handleShare}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </motion.button>

        {!currentUserId && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Sign in to interact</span>
        )}
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 overflow-hidden"
          >
            {currentUserId && (
              <form onSubmit={submitComment} className="mb-4">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Replying to @{replyingTo.username}</span>
                    <button
                      type="button"
                      onClick={() => { setReplyingTo(null); setNewComment(''); }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                    maxLength={300}
                  />
                  <motion.button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {submittingComment ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      replyingTo ? 'Reply' : 'Send'
                    )}
                  </motion.button>
                </div>
              </form>
            )}

            {loadingComments ? (
              <div className="text-center py-4">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment, idx) => (
                  <motion.div 
                    key={comment.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-2"
                  >
                    <div 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-xs font-medium shrink-0 cursor-pointer overflow-hidden"
                      onClick={() => navigateToProfile(comment.userId)}
                    >
                      {comment.profiles?.avatarUrl ? (
                        <img src={comment.profiles.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (comment.profiles?.username || 'A').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:underline"
                          onClick={() => navigateToProfile(comment.userId)}
                        >
                          {comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                      {currentUserId && (
                        <button
                          onClick={() => handleReply(comment)}
                          className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
