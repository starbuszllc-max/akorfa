'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Compass, User } from 'lucide-react';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import ExploreMenu from './ExploreMenu';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '#explore', label: 'Explore', icon: Compass, isExplore: true },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const isVisible = useScrollVisibility({ threshold: 24 });
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);

  const handleCloseExplore = useCallback(() => {
    setIsExploreOpen(false);
    exploreButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isExploreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isExploreOpen]);

  if (!mounted) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <AnimatePresence>
        {(isVisible || isExploreOpen) && (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.isExplore ? isExploreOpen : isActive(item.href);

                if (item.isExplore) {
                  return (
                    <button
                      ref={exploreButtonRef}
                      key={item.label}
                      onClick={() => setIsExploreOpen(!isExploreOpen)}
                      className="relative flex flex-col items-center justify-center w-16 h-full focus:outline-none"
                      aria-label={isExploreOpen ? 'Close explore menu' : 'Open explore menu'}
                      aria-expanded={isExploreOpen}
                    >
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center -mt-4 shadow-lg ${
                          active
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ rotate: isExploreOpen ? 45 : 0 }}
                      >
                        <Icon className="w-6 h-6" />
                      </motion.div>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsExploreOpen(false)}
                    className="relative flex flex-col items-center justify-center w-16 h-full focus:outline-none group"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        active
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-medium mt-0.5 ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {item.label}
                    </span>
                    {active && !item.isExplore && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <ExploreMenu isOpen={isExploreOpen} onClose={handleCloseExplore} />

      <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </>
  );
}
