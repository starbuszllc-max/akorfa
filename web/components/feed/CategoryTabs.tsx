'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Users, Radio, Search } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const categories: Category[] = [
  { id: 'live', label: 'Live', icon: <Radio className="w-3 h-3" />, color: 'text-red-500' },
  { id: 'akorfa', label: 'Akorfa', icon: <Flame className="w-3 h-3" />, color: 'text-orange-500' },
  { id: 'for-you', label: 'For You', icon: <Sparkles className="w-3 h-3" />, color: 'text-purple-500' },
  { id: 'following', label: 'Following', icon: <Users className="w-3 h-3" />, color: 'text-green-500' }
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  variant?: 'overlay' | 'normal';
  isVisible?: boolean;
}

export default function CategoryTabs({ activeCategory, onCategoryChange, variant = 'normal', isVisible = true }: CategoryTabsProps) {
  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-4 left-0 right-0 z-50 px-2 sm:px-4"
          >
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              <Link
                href="/discover"
                className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </Link>
              
              <div className="flex-1 flex gap-0.5 sm:gap-1 overflow-x-auto hide-scrollbar bg-black/40 backdrop-blur-md rounded-full p-1 sm:p-1.5">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className="relative px-2 sm:px-3 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-[10px] sm:text-xs font-medium transition-all flex-shrink-0"
                  >
                    {activeCategory === category.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/20 rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`relative flex items-center gap-1 ${
                      activeCategory === category.id ? 'text-white' : 'text-white/70'
                    }`}>
                      <span className={activeCategory === category.id ? category.color : ''}>
                        {category.icon}
                      </span>
                      <span>{category.label}</span>
                    </span>
                  </button>
                ))}
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
            className="relative px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors"
          >
            {activeCategory === category.id && (
              <motion.div
                layoutId="activeTabNormal"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`flex items-center gap-1.5 ${
              activeCategory === category.id 
                ? `${category.color} font-semibold` 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {category.icon}
              {category.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
