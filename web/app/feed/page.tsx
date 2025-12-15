'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Trophy, ChevronRight } from 'lucide-react';
import EnhancedPostComposer from '../../components/feed/EnhancedPostComposer';
import EnhancedPostCard from '../../components/feed/EnhancedPostCard';
import AnimatedBackground from '../../components/feed/AnimatedBackground';
import RightSidebar from '../../components/feed/RightSidebar';
import SkeletonPost from '../../components/feed/SkeletonPost';
import Toast from '../../components/feed/Toast';
import FloatingComposeButton from '../../components/feed/FloatingComposeButton';
import CameraCapture from '../../components/camera/CameraCapture';
import PullToRefresh from '../../components/ui/PullToRefresh';

interface Post {
  id: string;
  userId: string | null;
  content: string;
  layer: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  mediaUrls?: string[];
  mediaTypes?: string[];
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
  const [showProfileUnlockedModal, setShowProfileUnlockedModal] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

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
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const contentElement = mainContentRef.current?.closest('.overflow-y-auto') || mainContentRef.current?.parentElement;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, []);


  const handlePostCreated = (isFirstPost?: boolean) => {
    setRefreshTrigger(prev => prev + 1);
    setShowMobileComposer(false);
    if (isFirstPost) {
      setShowProfileUnlockedModal(true);
    }
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

  const handlePullRefresh = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

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
          const responseData = await res.json();
          setRefreshTrigger(prev => prev + 1);
          if (responseData.isFirstPost) {
            setShowProfileUnlockedModal(true);
          } else {
            showToast('Posted to feed!', 'success');
          }
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
      
      <PullToRefresh onRefresh={handlePullRefresh}>
        <main ref={mainContentRef} className="w-full lg:max-w-6xl lg:mx-auto px-0 lg:px-4 py-6 safe-area-top">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-amber-600 to-yellow-600 dark:from-amber-300 dark:via-amber-500 dark:to-yellow-500 bg-clip-text text-transparent">
                Community Feed
              </h1>
              <p className="text-slate-600 dark:text-amber-200/70 mt-1 font-medium">
                Discover insights from the Akorfa community
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
                            mediaUrls: post.mediaUrls,
                            mediaTypes: post.mediaTypes,
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
    </PullToRefresh>

    <AnimatePresence>
      {!isScrolling && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <FloatingComposeButton 
            onClick={() => setShowMobileComposer(true)} 
            onCameraClick={() => setShowCamera(true)} 
          />
        </motion.div>
      )}
    </AnimatePresence>

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

    <AnimatePresence>
      {showProfileUnlockedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfileUnlockedModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -top-2 -right-2 w-8 h-8"
              >
                <Sparkles className="w-8 h-8 text-amber-400" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="absolute -bottom-1 -left-1 w-6 h-6"
              >
                <Sparkles className="w-6 h-6 text-purple-400" />
              </motion.div>
            </div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
            >
              Congratulations!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 mb-6"
            >
              You've made your first post and unlocked your profile! Your journey of self-discovery begins now.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/profile"
                onClick={() => setShowProfileUnlockedModal(false)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
              >
                View Your Profile
                <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
}
