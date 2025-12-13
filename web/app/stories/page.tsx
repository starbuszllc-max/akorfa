'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import StoryViewer from '@/components/stories/StoryViewer';
import StoryCreator from '@/components/stories/StoryCreator';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    fullName: string | null;
  };
  stories: any[];
}

export default function StoriesPage() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStoryGroups(data.stories || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStoryCreated = () => {
    setShowCreator(false);
    fetchStories();
  };

  const handleNextGroup = () => {
    if (selectedGroupIndex !== null && selectedGroupIndex < storyGroups.length - 1) {
      setSelectedGroupIndex(selectedGroupIndex + 1);
    } else {
      setSelectedGroupIndex(null);
    }
  };

  if (selectedGroupIndex !== null && storyGroups[selectedGroupIndex]) {
    return (
      <div className="min-h-screen bg-gray-900">
        <StoryViewer
          group={storyGroups[selectedGroupIndex]}
          onClose={() => setSelectedGroupIndex(null)}
          onNext={handleNextGroup}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/feed">
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stories</h1>
          </div>
          {user && (
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              Create Story
            </button>
          )}
        </div>

        {showCreator && (
          <div className="mb-8">
            <StoryCreator onStoryCreated={handleStoryCreated} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : storyGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No stories yet</p>
            {user && (
              <button
                onClick={() => setShowCreator(true)}
                className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
              >
                Create Your First Story
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {storyGroups.map((group, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedGroupIndex(idx)}
                className="relative group overflow-hidden rounded-lg aspect-square"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-2 ring-2 ring-white">
                    {group.user.avatarUrl ? (
                      <img src={group.user.avatarUrl} alt={group.user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {group.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white text-center line-clamp-1">
                    {group.user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{group.stories.length} stories</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
