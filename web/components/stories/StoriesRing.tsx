'use client';

import { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';

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

interface StoriesRingProps {
  userId?: string;
  className?: string;
}

export default function StoriesRing({ userId, className = '' }: StoriesRingProps) {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    fetchStories();
    
    const interval = setInterval(fetchStories, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        setStoryGroups(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = () => {
    setShowCreator(false);
    fetchStories();
  };

  if (loading) {
    return (
      <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
            <div className="w-12 h-2 bg-gray-200 dark:bg-slate-700 rounded mt-1 mx-auto animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`}>
        {userId && (
          <button
            onClick={() => setShowCreator(true)}
            className="flex-shrink-0 w-16 flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <Plus className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate w-full text-center">
              Add Story
            </span>
          </button>
        )}

        {storyGroups.map((group) => (
          <button
            key={group.user.id}
            onClick={() => setSelectedGroup(group)}
            className="flex-shrink-0 w-16 flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 p-0.5">
                {group.user.avatarUrl ? (
                  <img
                    src={group.user.avatarUrl}
                    alt={group.user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate w-full text-center">
              {group.user.username}
            </span>
          </button>
        ))}

        {storyGroups.length === 0 && !userId && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
            No stories yet
          </p>
        )}
      </div>

      {selectedGroup && (
        <StoryViewer
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onNext={() => {
            const currentIndex = storyGroups.findIndex(g => g.user.id === selectedGroup.user.id);
            if (currentIndex < storyGroups.length - 1) {
              setSelectedGroup(storyGroups[currentIndex + 1]);
            } else {
              setSelectedGroup(null);
            }
          }}
        />
      )}

      {showCreator && userId && (
        <StoryCreator
          userId={userId}
          onClose={() => setShowCreator(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </>
  );
}
