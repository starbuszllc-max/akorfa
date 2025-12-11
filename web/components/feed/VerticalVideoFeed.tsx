'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Play, Volume2, VolumeX, Repeat2, Copy } from 'lucide-react';

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
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [pausedVideos, setPausedVideos] = useState<Set<string>>(new Set());
  const [observerReady, setObserverReady] = useState(false);
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

  const handleShare = (video: VideoPost) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this video on Akorfa',
        text: video.content.slice(0, 100),
        url: `${window.location.origin}/video/${video.id}`
      });
    }
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
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-6">
        <Play className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
        <p className="text-gray-400 text-center">Be the first to share a video in this category!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
      onScroll={handleScroll}
    >
      {isMuted && (
        <button
          onClick={handleUnmute}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium flex items-center gap-2 animate-pulse"
        >
          <VolumeX className="w-4 h-4" />
          Tap to unmute
        </button>
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
            className="h-screen w-full snap-start snap-always relative flex-shrink-0"
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

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-20 p-6 text-white pointer-events-none">
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

            <div className="absolute bottom-24 right-4 flex flex-col gap-5">
              <button
                onClick={() => handleLike(video)}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  whileTap={{ scale: 1.2 }}
                  className={`p-3 rounded-full backdrop-blur-sm ${
                    isLiked ? 'bg-red-500' : 'bg-black/40'
                  }`}
                >
                  <Heart
                    className="w-6 h-6 text-white"
                    fill={isLiked ? 'white' : 'none'}
                  />
                </motion.div>
                <span className="text-white text-xs font-semibold">
                  {(video.likeCount + (isLiked ? 1 : 0)).toLocaleString()}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {video.commentCount.toLocaleString()}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                  <Copy className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Duet</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                  <Repeat2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Repost</span>
              </button>

              <button onClick={() => handleShare(video)} className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Share</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                  <Bookmark className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">Save</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
