'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  label: string;
}

const categories: Category[] = [
  { id: 'live', label: 'Live' },
  { id: 'akorfa', label: 'Akorfa' },
  { id: 'for-you', label: 'For You' },
  { id: 'following', label: 'Following' }
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  variant?: 'overlay' | 'normal';
  isVisible?: boolean;
}

export default function CategoryTabs({ activeCategory, onCategoryChange, variant = 'normal', isVisible = true }: CategoryTabsProps) {
  const [akorScore, setAkorScore] = useState<number | null>(null);
  const [showScore, setShowScore] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('demo_user_id');
    if (storedUserId) {
      fetch(`/api/assessments?userId=${storedUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.assessments && data.assessments.length > 0) {
            const assessment = data.assessments[0];
            const score = assessment.overallScore || assessment.overall_score || 0;
            setAkorScore(score);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (akorScore !== null) {
      setShowScore(true);
      const timer = setTimeout(() => {
        setShowScore(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [akorScore]);

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-2 left-0 right-0 z-40 px-3"
          >
            <div className="flex items-center gap-2">
              <Link
                href="/discover"
                className="flex-shrink-0 p-2.5 bg-black/40 backdrop-blur-md rounded-full"
              >
                <Search className="w-5 h-5 text-white" />
              </Link>

              <div className="flex-1 flex gap-1 overflow-x-auto hide-scrollbar bg-black/40 backdrop-blur-md rounded-full px-2 py-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className="relative px-3 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0"
                  >
                    {activeCategory === category.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/20 rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span 
                      className={`relative text-sm font-bold tracking-tight ${
                        activeCategory === category.id ? 'text-white' : 'text-white/70'
                      }`}
                      style={{ fontStretch: 'condensed' }}
                    >
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-shrink-0 relative">
                <Link
                  href="/notifications"
                  className="block p-2.5 bg-black/40 backdrop-blur-md rounded-full"
                >
                  <Bell className="w-5 h-5 text-white" />
                </Link>
                
                <AnimatePresence>
                  {showScore && akorScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        {Math.round(akorScore)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex gap-1 overflow-x-auto hide-scrollbar px-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className="relative px-4 py-3 whitespace-nowrap text-sm font-bold transition-colors"
          >
            {activeCategory === category.id && (
              <motion.div
                layoutId="activeTabNormal"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={
              activeCategory === category.id 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-600 dark:text-gray-400'
            }>
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
