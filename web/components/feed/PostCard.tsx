'use client';
import React, { useState, useRef } from 'react';
import TipButton from '@/components/tipping/TipButton';

interface Comment {
  id: string;
  postId: string;
  userId: string | null;
  content: string;
  createdAt: string;
  profiles: {
    username: string | null;
    avatarUrl: string | null;
  } | null;
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
  };
  currentUserId: string | null;
  onLike?: (postId: string) => void;
  onCommentAdded?: (postId: string) => void;
}

const layerColors: Record<string, { bg: string; text: string }> = {
  environment: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  bio: { bg: 'bg-rose-100', text: 'text-rose-700' },
  internal: { bg: 'bg-purple-100', text: 'text-purple-700' },
  cultural: { bg: 'bg-amber-100', text: 'text-amber-700' },
  social: { bg: 'bg-blue-100', text: 'text-blue-700' },
  conscious: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  existential: { bg: 'bg-violet-100', text: 'text-violet-700' },
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

export default function PostCard({ post, currentUserId, onLike, onCommentAdded }: PostProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [commentAnimating, setCommentAnimating] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const commentButtonRef = useRef<HTMLButtonElement>(null);

  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url;
  const layerStyle = layerColors[post.layer] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  async function fetchComments() {
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
  }

  async function toggleComments() {
    setCommentAnimating(true);
    setTimeout(() => setCommentAnimating(false), 400);
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
          content: newComment.trim()
        })
      });

      if (resp.ok) {
        setNewComment('');
        setLocalCommentCount(prev => prev + 1);
        await fetchComments();
        onCommentAdded?.(post.id);
      } else {
        const error = await resp.json();
        console.error('Error creating comment:', error);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleLike() {
    if (!currentUserId || isLiking || hasLiked) return;
    
    setIsLiking(true);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 500);
    
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
        onLike?.(post.id);
      } else {
        const error = await resp.json();
        if (error.error?.includes('duplicate') || error.error?.includes('unique')) {
          setHasLiked(true);
        } else {
          console.error('Failed to like post:', error);
        }
      }
    } catch (err) {
      console.error('Error liking post:', err);
    } finally {
      setIsLiking(false);
    }
  }

  return (
    <article className="post-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username} 
              className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 text-sm">{username}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${layerStyle.bg} ${layerStyle.text}`}>
          {post.layer}
        </span>
      </div>

      <p className="mt-3 text-gray-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed">{post.content}</p>

      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-3">
        <button 
          ref={likeButtonRef}
          onClick={handleLike}
          disabled={!currentUserId || isLiking || hasLiked}
          className={`flex items-center gap-1.5 text-sm transition-colors button-glow ${
            likeAnimating ? 'animate-like-pulse' : ''
          } ${
            hasLiked 
              ? 'text-rose-500 cursor-default' 
              : currentUserId 
                ? 'text-gray-700 hover:text-rose-500' 
                : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg 
            className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} 
            fill={hasLiked ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={hasLiked ? 0 : 1.5} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          <span>{post.like_count ?? 0}</span>
        </button>

        <button 
          ref={commentButtonRef}
          onClick={toggleComments}
          className={`flex items-center gap-1.5 text-sm transition-colors button-glow ${
            commentAnimating ? 'animate-comment-pop' : ''
          } ${
            showComments ? 'text-blue-500' : 'text-gray-700 hover:text-blue-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{localCommentCount ?? 0}</span>
        </button>

        {post.user_id && currentUserId && post.user_id !== currentUserId && (
          <TipButton 
            receiverId={post.user_id}
            receiverName={username}
            postId={post.id}
          />
        )}

        {!currentUserId && (
          <span className="ml-auto text-xs text-gray-400">Sign in to interact</span>
        )}
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {currentUserId && (
            <form onSubmit={submitComment} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={300}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {submittingComment ? '...' : 'Send'}
                </button>
              </div>
            </form>
          )}

          {loadingComments ? (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-2">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {(comment.profiles?.username || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {comment.profiles?.username || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
