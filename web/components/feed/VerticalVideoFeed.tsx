'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX } from 'lucide-react';

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
}

export default function VerticalVideoFeed({ category = 'for-you', userLayerScores }: VerticalVideoFeedProps) {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    fetchVideos();
  }, [category, userLayerScores]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          if (isPlaying) video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isPlaying]);

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

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setLiked(false);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setLiked(false);
    }
  }, [currentIndex, videos.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleScroll('down');
      } else {
        handleScroll('up');
      }
    }
  };

  const handleLike = async () => {
    const video = videos[currentIndex];
    if (!video) return;

    setLiked(!liked);
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

  const handleShare = () => {
    const video = videos[currentIndex];
    if (navigator.share && video) {
      navigator.share({
        title: 'Check out this video on Akorfa',
        text: video.content.slice(0, 100),
        url: `${window.location.origin}/video/${video.id}`
      });
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

  const currentVideo = videos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-black overflow-hidden relative snap-y snap-mandatory"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVideo.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full w-full relative"
        >
          <video
            ref={el => { videoRefs.current[currentIndex] = el; }}
            src={currentVideo.videoUrl}
            poster={currentVideo.videoThumbnail}
            className="h-full w-full object-cover"
            loop
            playsInline
            muted={isMuted}
            onClick={() => setIsPlaying(!isPlaying)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 flex items-center justify-center"
          >
            {!isPlaying && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
              </motion.div>
            )}
          </button>

          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-20 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={currentVideo.profiles.avatarUrl || '/default-avatar.png'}
                alt={currentVideo.profiles.username}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <div>
                <div className="font-semibold">{currentVideo.profiles.username}</div>
                <div className="text-xs text-gray-300">
                  {currentVideo.layer.charAt(0).toUpperCase() + currentVideo.layer.slice(1)} Layer
                </div>
              </div>
            </div>
            <p className="text-sm line-clamp-3 mb-2">{currentVideo.content}</p>
          </div>

          <div className="absolute bottom-24 right-4 flex flex-col gap-6">
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                whileTap={{ scale: 1.2 }}
                className={`p-3 rounded-full backdrop-blur-sm ${
                  liked ? 'bg-red-500' : 'bg-black/40'
                }`}
              >
                <Heart
                  className="w-7 h-7 text-white"
                  fill={liked ? 'white' : 'none'}
                />
              </motion.div>
              <span className="text-white text-xs font-semibold">
                {(currentVideo.likeCount + (liked ? 1 : 0)).toLocaleString()}
              </span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">
                {currentVideo.commentCount.toLocaleString()}
              </span>
            </button>

            <button onClick={handleShare} className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                <Share2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-white text-xs font-semibold">Share</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm">
                <Bookmark className="w-7 h-7 text-white" />
              </div>
            </button>
          </div>

          <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 pointer-events-none">
            {currentIndex > 0 && (
              <button
                onClick={() => handleScroll('up')}
                className="pointer-events-auto p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
              >
                ↑
              </button>
            )}
            {currentIndex < videos.length - 1 && (
              <button
                onClick={() => handleScroll('down')}
                className="pointer-events-auto ml-auto p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
              >
                ↓
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
