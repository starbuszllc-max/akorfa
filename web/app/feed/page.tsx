'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedPostComposer from '../../components/feed/EnhancedPostComposer';
import EnhancedPostCard from '../../components/feed/EnhancedPostCard';
import AnimatedBackground from '../../components/feed/AnimatedBackground';
import RightSidebar from '../../components/feed/RightSidebar';
import SkeletonPost from '../../components/feed/SkeletonPost';
import Toast from '../../components/feed/Toast';
import FloatingComposeButton from '../../components/feed/FloatingComposeButton';
import CameraCapture from '../../components/camera/CameraCapture';

interface Post {
  id: string;
  userId: string | null;
  content: string;
  layer: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  profiles?: {
    username: string | null;
    avatarUrl: string | null;
  } | null;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [showMobileComposer, setShowMobileComposer] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  const fetchPosts = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null;
      setCurrentUserId(storedUserId);

      const page = append ? pageRef.current + 1 : 1;
      const resp = await fetch(`/api/posts?page=${page}&limit=10`);
      const data = await resp.json();

      if (resp.ok && data.posts) {
        if (append) {
          setPosts(prev => [...prev, ...data.posts]);
          pageRef.current = page;
        } else {
          setPosts(data.posts);
          pageRef.current = 1;
        }
        setHasMore(data.posts.length === 10);
      } else {
        console.error('Error fetching posts:', data.error);
        if (!append) setPosts([]);
      }
    } catch (err) {
      console.error(err);
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPosts]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !loadingMore) {
        fetchPosts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, loadingMore, fetchPosts]);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowMobileComposer(false);
  };

  const handleLikeUpdate = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likeCount: (p.likeCount ?? 0) + 1 }
        : p
    ));
  };

  const handleCommentAdded = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, commentCount: (p.commentCount ?? 0) + 1 }
        : p
    ));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const handleCameraCapture = async (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    layer: string;
    destination: 'feed' | 'story' | 'save';
  }) => {
    if (data.destination === 'feed') {
      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            content: '',
            layer: data.layer,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType
          })
        });
        if (res.ok) {
          showToast('Posted to feed!', 'success');
          setRefreshTrigger(prev => prev + 1);
        }
      } catch (error) {
        showToast('Failed to post', 'error');
      }
    } else if (data.destination === 'story') {
      showToast('Stories coming soon!', 'info');
    } else {
      showToast('Saved to gallery!', 'success');
    }
  };

  return (
    <>
      <AnimatedBackground />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                Community Feed
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Share your journey across the 7 layers
              </p>
            </motion.div>

            <div className="hidden md:block">
              <EnhancedPostComposer onPostCreated={handlePostCreated} onToast={showToast} />
            </div>

            <div className="space-y-4">
              {loading ? (
                <>
                  <SkeletonPost />
                  <SkeletonPost />
                  <SkeletonPost />
                </>
              ) : posts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
                >
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">No posts yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Be the first to share something!</p>
                </motion.div>
              ) : (
                <>
                  <AnimatePresence>
                    {posts.map((post, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <EnhancedPostCard 
                          post={{
                            id: post.id,
                            user_id: post.userId,
                            content: post.content,
                            layer: post.layer,
                            like_count: post.likeCount ?? 0,
                            comment_count: post.commentCount ?? 0,
                            created_at: post.createdAt,
                            profiles: post.profiles ? {
                              username: post.profiles.username,
                              avatar_url: post.profiles.avatarUrl
                            } : null
                          }} 
                          currentUserId={currentUserId}
                          onLike={handleLikeUpdate}
                          onCommentAdded={handleCommentAdded}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div ref={observerRef} className="h-10" />

                  {loadingMore && (
                    <div className="space-y-4">
                      <SkeletonPost />
                      <SkeletonPost />
                    </div>
                  )}

                  {!hasMore && posts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-400 dark:text-gray-500"
                    >
                      You've reached the end
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
      </main>

      <FloatingComposeButton 
        onClick={() => setShowMobileComposer(true)} 
        onCameraClick={() => setShowCamera(true)} 
      />

      <AnimatePresence>
        {showMobileComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:hidden"
            onClick={() => setShowMobileComposer(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-white dark:bg-slate-800 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
              <EnhancedPostComposer onPostCreated={handlePostCreated} onToast={showToast} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onClose={() => setShowCamera(false)}
            onCapture={handleCameraCapture}
            userId={currentUserId}
          />
        )}
      </AnimatePresence>
    </>
  );
}
