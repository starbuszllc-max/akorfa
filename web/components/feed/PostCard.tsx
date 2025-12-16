'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    media_urls?: string[];
    media_types?: string[];
    profiles: {
      username: string | null;
      avatar_url: string | null;
    } | null;
  };
  currentUserId: string | null;
  onLike?: (postId: string) => void;
  onCommentAdded?: (postId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (postId: string, newContent: string) => void;
}

const layerColors: Record<string, { bg: string; text: string }> = {
  environment: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  bio: { bg: 'bg-rose-100', text: 'text-rose-700' },
  internal: { bg: 'bg-purple-100', text: 'text-purple-700' },
  cultural: { bg: 'bg-green-100', text: 'text-green-700' },
  social: { bg: 'bg-blue-100', text: 'text-blue-700' },
  conscious: { bg: 'bg-green-100', text: 'text-green-700' },
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

export default function PostCard({ post, currentUserId, onLike, onCommentAdded, onPostDeleted, onPostUpdated }: PostProps) {
  const router = useRouter();
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
  
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url;
  const layerStyle = layerColors[post.layer] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const isOwner = currentUserId && post.user_id === currentUserId;
  
  const handleMediaClick = (url: string, mediaType: string) => {
    const isVideo = typeof mediaType === 'string' && mediaType.toLowerCase().includes('video');
    if (isVideo) {
      router.push(`/live?video=${encodeURIComponent(url)}`);
    }
  };

  async function handleDelete() {
    if (!currentUserId || isDeleting) return;
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/posts/${post.id}?user_id=${currentUserId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        onPostDeleted?.(post.id);
      } else {
        const error = await resp.json();
        console.error('Failed to delete post:', error);
        alert('Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Error deleting post');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setShowMenu(false);
    }
  }

  async function handleSaveEdit() {
    if (!currentUserId || isSaving || !editContent.trim()) return;
    setIsSaving(true);
    try {
      const resp = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          content: editContent.trim()
        })
      });
      if (resp.ok) {
        onPostUpdated?.(post.id, editContent.trim());
        setIsEditing(false);
      } else {
        const error = await resp.json();
        console.error('Failed to update post:', error);
        alert('Failed to update post');
      }
    } catch (err) {
      console.error('Error updating post:', err);
      alert('Error updating post');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditContent(post.content);
    setIsEditing(false);
  }

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
    <article className="post-card px-4 md:px-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username} 
              className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-green-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 text-sm">{username}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${layerStyle.bg} ${layerStyle.text}`}>
            {post.layer}
          </span>
          <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Post options"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-20 min-w-[140px]">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { router.push(`/ai-mentor?context=${encodeURIComponent(post.content)}`); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Ask AI
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(post.content); setShowMenu(false); alert('Copied to clipboard!'); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Text
                      </button>
                      <button
                        onClick={() => { navigator.share?.({ title: 'Akorfa Post', text: post.content, url: window.location.href }) || navigator.clipboard.writeText(window.location.href); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </button>
                      <div className="h-px bg-gray-200 dark:bg-slate-600 my-1"></div>
                      <button
                        onClick={() => { alert('Post reported. Our team will review it.'); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Report Post
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
            rows={4}
            maxLength={1000}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editContent.trim()}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-gray-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed">{editContent}</p>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Post?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone. Are you sure you want to delete this post?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {post.media_urls.map((url, idx) => {
            if (!url) return null;
            
            const mediaType = post.media_types?.[idx] || '';
            const isVideo = typeof mediaType === 'string' && mediaType.toLowerCase().includes('video');
            
            return (
              <button
                key={idx}
                onClick={() => handleMediaClick(url, mediaType)}
                className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                type="button"
              >
                {isVideo ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={url}
                    alt="Post media"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2 fixed md:relative bottom-28 left-0 right-0 px-4 md:px-0 bg-white md:bg-transparent z-10 md:z-auto">
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
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
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
