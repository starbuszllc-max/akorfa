'use client';

import { motion } from 'framer-motion';
import { Flame, Sparkles, Users, Zap, Radio, Compass } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const categories: Category[] = [
  { id: 'live', label: 'Live', icon: <Radio className="w-3 h-3" />, color: 'text-red-500' },
  { id: 'stem', label: 'STEM', icon: <Zap className="w-3 h-3" />, color: 'text-blue-500' },
  { id: 'for-you', label: 'For You', icon: <Sparkles className="w-3 h-3" />, color: 'text-purple-500' },
  { id: 'following', label: 'Following', icon: <Users className="w-3 h-3" />, color: 'text-green-500' },
  { id: 'akorfa-live', label: 'Akorfa', icon: <Flame className="w-3 h-3" />, color: 'text-orange-500' },
  { id: 'explore', label: 'Explore', icon: <Compass className="w-3 h-3" />, color: 'text-indigo-500' }
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  variant?: 'overlay' | 'normal';
}

export default function CategoryTabs({ activeCategory, onCategoryChange, variant = 'normal' }: CategoryTabsProps) {
  if (variant === 'overlay') {
    return (
      <div className="fixed top-4 left-0 right-0 z-50 px-2 sm:px-4">
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto hide-scrollbar bg-black/40 backdrop-blur-md rounded-full p-1 sm:p-1.5 max-w-2xl mx-auto">
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
