'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Play, Volume2, VolumeX, Repeat2, Copy, Check, Plus } from 'lucide-react';
import Link from 'next/link';
import VideoCommentModal from './VideoCommentModal';

interface VideoPost {
  id: string;
  userId: string;
  content: string;
  layer: string;
  videoUrl: string;
  videoThumbnail?: string;
  videoDuration?: number;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  profiles: {
    username: string;
    avatarUrl?: string;
  };
}

interface VerticalVideoFeedProps {
  category?: string;
  userLayerScores?: Record<string, number>;
  onVideoChange?: (isScrolling: boolean) => void;
}

export default function VerticalVideoFeed({ category = 'for-you', userLayerScores, onVideoChange }: VerticalVideoFeedProps) {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [repostedVideos, setRepostedVideos] = useState<Set<string>>(new Set());
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [pausedVideos, setPausedVideos] = useState<Set<string>>(new Set());
  const [observerReady, setObserverReady] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef(isMuted);
  const pausedVideosRef = useRef(pausedVideos);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    pausedVideosRef.current = pausedVideos;
  }, [pausedVideos]);

  useEffect(() => {
    fetchVideos();
  }, [category, userLayerScores]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'AudioVolumeUp' || e.key === 'AudioVolumeDown' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (isMuted) {
          setIsMuted(false);
          videoRefs.current.forEach((video) => {
            video.muted = false;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMuted]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute('data-video-id');
          if (!videoId) return;
          
          const video = videoRefs.current.get(videoId);
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveVideoId(videoId);
            if (video && !pausedVideosRef.current.has(videoId)) {
              video.currentTime = 0;
              video.muted = isMutedRef.current;
              video.play().catch(() => {});
            }
          } else {
            if (video) {
              video.pause();
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.6],
      }
    );

    setObserverReady(true);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (observerReady && observerRef.current) {
      videoContainerRefs.current.forEach((element) => {
        observerRef.current?.observe(element);
      });
    }
  }, [observerReady, videos]);

  const registerVideoContainer = useCallback((videoId: string, element: HTMLDivElement | null) => {
    if (element) {
      videoContainerRefs.current.set(videoId, element);
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      const existingElement = videoContainerRefs.current.get(videoId);
      if (existingElement && observerRef.current) {
        observerRef.current.unobserve(existingElement);
      }
      videoContainerRefs.current.delete(videoId);
    }
  }, []);

  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams({
        type: 'video',
        category: category,
        limit: '20'
      });
      
      if (userLayerScores) {
        params.append('layerScores', JSON.stringify(userLayerScores));
      }

      const res = await fetch(`/api/posts/video-feed?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmute = useCallback(() => {
    setIsMuted(false);
    videoRefs.current.forEach((video) => {
      video.muted = false;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRefs.current.forEach((video) => {
      video.muted = newMuted;
    });
  }, [isMuted]);

  const handleScroll = useCallback(() => {
    onVideoChange?.(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      onVideoChange?.(false);
    }, 150);
  }, [onVideoChange]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleLike = async (video: VideoPost) => {
    const isLiked = likedVideos.has(video.id);
    
    setLikedVideos(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(video.id);
      } else {
        next.add(video.id);
      }
      return next;
    });

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: video.id,
          reactionType: 'like',
          userId: localStorage.getItem('demo_user_id')
        })
      });
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleShare = async (video: VideoPost) => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this video on Akorfa',
          text: video.content.slice(0, 100),
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleOpenComments = (videoId: string) => {
    setSelectedVideoId(videoId);
    setCommentModalOpen(true);
  };

  const handleCloseComments = () => {
    setCommentModalOpen(false);
    setSelectedVideoId(null);
  };

  const handleCommentAdded = () => {
    if (selectedVideoId) {
      setCommentCounts(prev => ({
        ...prev,
        [selectedVideoId]: (prev[selectedVideoId] || 0) + 1
      }));
    }
  };

  const handleSave = async (video: VideoPost) => {
    const isSaved = savedVideos.has(video.id);
    
    setSavedVideos(prev => {
      const next = new Set(prev);
      if (isSaved) {
        next.delete(video.id);
      } else {
        next.add(video.id);
      }
      return next;
    });

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: video.id,
          reactionType: 'bookmark',
          userId: localStorage.getItem('demo_user_id')
        })
      });
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  };

  const handleRepost = async (video: VideoPost) => {
    const isReposted = repostedVideos.has(video.id);
    
    if (isReposted) return; // Can't un-repost
    
    setRepostedVideos(prev => {
      const next = new Set(prev);
      next.add(video.id);
      return next;
    });

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: video.id,
          reactionType: 'repost',
          userId: localStorage.getItem('demo_user_id')
        })
      });
    } catch (error) {
      console.error('Failed to repost video:', error);
    }
  };

  const handleDuet = (video: VideoPost) => {
    // Navigate to create page with duet reference
    window.location.href = `/create?duet=${video.id}`;
  };

  const handleVideoClick = (videoId: string) => {
    const video = videoRefs.current.get(videoId);
    if (video) {
      if (video.paused) {
        setPausedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
        video.play().catch(() => {});
      } else {
        setPausedVideos(prev => {
          const next = new Set(prev);
          next.add(videoId);
          return next;
        });
        video.pause();
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-black flex items-center justify-center" style={{ height: '100dvh', minHeight: '100vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full bg-black flex flex-col items-center justify-center text-white p-6" style={{ height: '100dvh', minHeight: '100vh' }}>
        <Play className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
        <p className="text-gray-400 text-center">Be the first to share a video in this category!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollBehavior: 'smooth', height: '100dvh', minHeight: '100vh' }}
      onScroll={handleScroll}
    >
      {isMuted && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3">
          <button
            onClick={handleUnmute}
            className="px-6 py-3 bg-black/50 backdrop-blur-md rounded-full text-white text-base font-semibold flex items-center gap-2 border border-white/30"
          >
            <VolumeX className="w-5 h-5" strokeWidth={2.5} />
            Tap to unmute
          </button>
          <button
            onClick={handleToggleMute}
            className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <VolumeX className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {videos.map((video) => {
        const isLiked = likedVideos.has(video.id);
        const isActive = activeVideoId === video.id;
        const isPaused = pausedVideos.has(video.id);

        return (
          <div
            key={video.id}
            ref={(el) => registerVideoContainer(video.id, el)}
            data-video-id={video.id}
            className="w-full snap-start snap-always relative flex-shrink-0"
            style={{ height: '100dvh', minHeight: '100vh' }}
          >
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(video.id, el);
                }
              }}
              src={video.videoUrl}
              poster={video.videoThumbnail}
              className="h-full w-full object-cover"
              loop
              playsInline
              muted={isMuted}
              onClick={() => handleVideoClick(video.id)}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {(!isActive || isPaused) && (
              <button
                onClick={() => handleVideoClick(video.id)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </motion.div>
              </button>
            )}

            <div className="absolute bottom-20 right-2 flex flex-col gap-5 items-center z-40">
              <button
                onClick={handleToggleMute}
                className="flex flex-col items-center gap-1"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                ) : (
                  <Volume2 className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                )}
                <span className="text-white text-xs font-bold drop-shadow-lg">
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </button>

              <button
                onClick={() => handleLike(video)}
                className="flex flex-col items-center gap-1"
              >
                <motion.div whileTap={{ scale: 1.2 }}>
                  <Heart
                    className={`w-6 h-6 drop-shadow-lg ${isLiked ? 'text-red-500' : 'text-white'}`}
                    strokeWidth={2.5}
                    fill={isLiked ? 'currentColor' : 'none'}
                  />
                </motion.div>
                <span className="text-white text-xs font-bold drop-shadow-lg">
                  {(video.likeCount + (isLiked ? 1 : 0)).toLocaleString()}
                </span>
              </button>

              <button 
                onClick={() => handleOpenComments(video.id)}
                className="flex flex-col items-center gap-1"
              >
                <MessageCircle className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                <span className="text-white text-xs font-bold drop-shadow-lg">
                  {(video.commentCount + (commentCounts[video.id] || 0)).toLocaleString()}
                </span>
              </button>

              <button 
                onClick={() => handleDuet(video)}
                className="flex flex-col items-center gap-1"
              >
                <Copy className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                <span className="text-white text-xs font-bold drop-shadow-lg">Duet</span>
              </button>

              <button 
                onClick={() => handleRepost(video)}
                className="flex flex-col items-center gap-1"
              >
                <motion.div whileTap={{ scale: 1.2 }}>
                  {repostedVideos.has(video.id) ? (
                    <Check className="w-6 h-6 text-green-400 drop-shadow-lg" strokeWidth={2.5} />
                  ) : (
                    <Repeat2 className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                  )}
                </motion.div>
                <span className="text-white text-xs font-bold drop-shadow-lg">
                  {repostedVideos.has(video.id) ? 'Reposted' : 'Repost'}
                </span>
              </button>

              <button 
                onClick={() => handleShare(video)} 
                className="flex flex-col items-center gap-1"
              >
                <Share2 className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />
                <span className="text-white text-xs font-bold drop-shadow-lg">Share</span>
              </button>

              <button 
                onClick={() => handleSave(video)}
                className="flex flex-col items-center gap-1"
              >
                <motion.div whileTap={{ scale: 1.2 }}>
                  <Bookmark 
                    className={`w-6 h-6 drop-shadow-lg ${savedVideos.has(video.id) ? 'text-yellow-400' : 'text-white'}`}
                    strokeWidth={2.5}
                    fill={savedVideos.has(video.id) ? 'currentColor' : 'none'}
                  />
                </motion.div>
                <span className="text-white text-xs font-bold drop-shadow-lg">
                  {savedVideos.has(video.id) ? 'Saved' : 'Save'}
                </span>
              </button>

              <Link href="/create" className="flex flex-col items-center gap-1">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center"
                >
                  <Plus className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={3} />
                </motion.div>
                <span className="text-white text-xs font-bold drop-shadow-lg">Create</span>
              </Link>
            </div>

            <div className="absolute bottom-16 left-0 right-20 p-6 text-white pointer-events-none">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={video.profiles.avatarUrl || '/default-avatar.png'}
                  alt={video.profiles.username}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div>
                  <div className="font-semibold">{video.profiles.username}</div>
                  <div className="text-xs text-gray-300">
                    {video.layer.charAt(0).toUpperCase() + video.layer.slice(1)} Layer
                  </div>
                </div>
              </div>
              <p className="text-sm line-clamp-3 mb-2">{video.content}</p>
            </div>
          </div>
        );
      })}

      <VideoCommentModal
        isOpen={commentModalOpen}
        onClose={handleCloseComments}
        postId={selectedVideoId || ''}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}
