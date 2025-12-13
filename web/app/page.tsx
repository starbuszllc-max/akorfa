'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import VerticalVideoFeed from '@/components/feed/VerticalVideoFeed';
import CategoryTabs from '@/components/feed/CategoryTabs';
import FloatingCreateButton from '@/components/ui/FloatingCreateButton';

const CATEGORIES = ['live', 'akorfa', 'for-you', 'following'];

export default function Home() {
  const [category, setCategory] = useState('for-you');
  const [userLayerScores, setUserLayerScores] = useState<Record<string, number> | undefined>();
  const [isUIVisible, setIsUIVisible] = useState(true);
  const touchStartXRef = useRef<number>(0);

  useEffect(() => {
    const storedUserId = localStorage.getItem('demo_user_id');

    const fetchUserAssessment = async () => {
      try {
        if (!storedUserId) return;

        const res = await fetch(`/api/assessments?userId=${storedUserId}`);
        const data = await res.json();
        
        if (data.assessments && data.assessments.length > 0) {
          const latestAssessment = data.assessments[0];
          setUserLayerScores(latestAssessment.layerScores);
        }
      } catch (error) {
        console.error('Failed to fetch user assessment:', error);
      }
    };

    fetchUserAssessment();
  }, []);

  const handleVideoChange = useCallback((isScrolling: boolean) => {
    setIsUIVisible(!isScrolling);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      const currentIndex = CATEGORIES.indexOf(category);
      if (diff > 0) {
        // Swiped left - go to next category
        const nextIndex = (currentIndex + 1) % CATEGORIES.length;
        setCategory(CATEGORIES[nextIndex]);
      } else {
        // Swiped right - go to previous category
        const prevIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
        setCategory(CATEGORIES[prevIndex]);
      }
    }
  }, [category]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <CategoryTabs
        activeCategory={category}
        onCategoryChange={setCategory}
        variant="overlay"
        isVisible={isUIVisible}
      />
      <VerticalVideoFeed
        category={category}
        userLayerScores={userLayerScores}
        onVideoChange={handleVideoChange}
      />
      <FloatingCreateButton isVisible={isUIVisible} />
    </div>
  );
}
