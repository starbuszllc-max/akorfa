'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, User, Eye, Clock } from 'lucide-react';

interface Story {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  layer: string | null;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    fullName: string | null;
  };
  stories: Story[];
}

interface StoryViewerProps {
  group: StoryGroup;
  onClose: () => void;
  onNext: () => void;
}

export default function StoryViewer({ group, onClose, onNext }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const currentStory = group.stories[currentIndex];
  const displayViewCount = viewCounts[currentStory.id] ?? currentStory.viewCount;

  useEffect(() => {
    fetch('/api/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId: currentStory.id, action: 'view' })
    })
      .then(() => {
        setViewCounts(prev => ({
          ...prev,
          [currentStory.id]: (prev[currentStory.id] ?? currentStory.viewCount) + 1
        }));
      })
      .catch(console.error);
  }, [currentStory.id]);

  useEffect(() => {
    setProgress(0);
    
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }

    const duration = 5000;
    const interval = 50;
    let elapsed = 0;

    progressRef.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        goNext();
      }
    }, interval);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [currentIndex, group.user.id]);

  const goNext = () => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onNext();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / 60000);
    
    if (diffHours > 0) return `${diffHours}h ${diffMins}m left`;
    return `${diffMins}m left`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto">
        <div className="absolute top-0 left-0 right-0 z-20 p-3">
          <div className="flex gap-1 mb-3">
            {group.stories.map((_, idx) => (
              <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{ 
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {group.user.avatarUrl ? (
                <img
                  src={group.user.avatarUrl}
                  alt={group.user.username}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center border-2 border-white">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="text-white text-sm font-medium">{group.user.username}</p>
                <p className="text-white/70 text-xs">{getTimeAgo(currentStory.createdAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {currentStory.mediaUrl ? (
            currentStory.mediaType === 'video' ? (
              <video
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-8">
              <p className="text-white text-xl font-medium text-center">
                {currentStory.content}
              </p>
            </div>
          )}

          {currentStory.content && currentStory.mediaUrl && (
            <div className="absolute bottom-20 left-0 right-0 p-4">
              <p className="text-white text-center text-lg font-medium drop-shadow-lg">
                {currentStory.content}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10"
          aria-label="Previous"
        />
        <button
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 z-10"
          aria-label="Next"
        />

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 text-white/70 text-xs">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{displayViewCount} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{getTimeRemaining(currentStory.expiresAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
