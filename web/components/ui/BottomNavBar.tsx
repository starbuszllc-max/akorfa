'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, MoreHorizontal, Trophy, User } from 'lucide-react';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import ExploreMenu from './ExploreMenu';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '#explore', label: 'More', icon: MoreHorizontal, isExplore: true },
  { href: '/challenges', label: 'Challenges', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const isVisible = useScrollVisibility({ threshold: 24 });
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  
  const isVideoPage = pathname === '/';

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
            className={`fixed bottom-0 left-0 right-0 z-40 ${isVideoPage ? 'bg-transparent' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-slate-700/50'}`}
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
          >
            <div className="flex items-center h-16 w-full">
              {/* Home - Left Edge */}
              {navItems[0] && (
                <Link
                  href={navItems[0].href}
                  onClick={() => setIsExploreOpen(false)}
                  className="w-16 flex flex-col items-center justify-center h-full focus:outline-none group relative"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isVideoPage
                        ? isActive(navItems[0].href) ? 'bg-white/30 backdrop-blur-sm' : ''
                        : isActive(navItems[0].href)
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-slate-800'
                    }`}
                    style={isVideoPage ? {
                      filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 2px rgba(0,0,0,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                    } : undefined}
                  >
                    <Home className={`w-5 h-5 ${isVideoPage ? 'text-white' : ''}`} strokeWidth={isVideoPage ? 2.5 : 2} />
                  </div>
                  <span 
                    className={`text-[10px] font-medium mt-1 ${
                      isVideoPage
                        ? 'text-white font-semibold'
                        : isActive(navItems[0].href)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={isVideoPage ? { textShadow: '0 0 2px #000, 0 0 4px #000, 0 0 6px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.9)' } : undefined}
                  >
                    Home
                  </span>
                  {isActive(navItems[0].href) && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className={`absolute -bottom-0 w-6 h-0.5 rounded-full ${isVideoPage ? 'bg-white' : 'bg-indigo-500'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )}

              {/* Middle Items - Feed, More, Challenges with flex growth */}
              <div className="flex-1 flex items-center justify-evenly h-full">
                {navItems.slice(1, 4).map((item, index) => {
                  const Icon = item.icon;
                  const active = item.isExplore ? isExploreOpen : isActive(item.href);
                  const isMores = item.isExplore;

                  if (item.isExplore) {
                    return (
                      <button
                        ref={exploreButtonRef}
                        key={item.label}
                        onClick={() => setIsExploreOpen(!isExploreOpen)}
                        className="relative flex flex-col items-center justify-center h-full focus:outline-none"
                        aria-label={isExploreOpen ? 'Close explore menu' : 'Open explore menu'}
                        aria-expanded={isExploreOpen}
                      >
                        <motion.div
                          className="flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ rotate: isExploreOpen ? 45 : 0 }}
                          style={isVideoPage ? {
                            filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 2px rgba(0,0,0,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                          } : undefined}
                        >
                          <Icon className={`w-8 h-8 ${isVideoPage ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} strokeWidth={4} />
                        </motion.div>
                        <span 
                          className={`text-[10px] font-semibold mt-0.5 ${isVideoPage ? 'text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                          style={isVideoPage ? { textShadow: '0 0 2px #000, 0 0 4px #000, 0 0 6px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.9)' } : undefined}
                        >
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
                      className="relative flex flex-col items-center justify-center h-full focus:outline-none group"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isVideoPage
                            ? active ? 'bg-white/30 backdrop-blur-sm' : ''
                            : active
                              ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-slate-800'
                        }`}
                        style={isVideoPage ? {
                          filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 2px rgba(0,0,0,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                        } : undefined}
                      >
                        <Icon className={`w-5 h-5 ${isVideoPage ? 'text-white' : ''}`} strokeWidth={isVideoPage ? 2.5 : 2} />
                      </div>
                      <span 
                        className={`text-[10px] font-medium mt-1 ${
                          isVideoPage
                            ? 'text-white font-semibold'
                            : active
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                        style={isVideoPage ? { textShadow: '0 0 2px #000, 0 0 4px #000, 0 0 6px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.9)' } : undefined}
                      >
                        {item.label}
                      </span>
                      {active && !item.isExplore && (
                        <motion.div
                          layoutId="bottomNavIndicator"
                          className={`absolute -bottom-0 w-6 h-0.5 rounded-full ${isVideoPage ? 'bg-white' : 'bg-indigo-500'}`}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Profile - Right Edge */}
              {navItems[4] && (
                <Link
                  href={navItems[4].href}
                  onClick={() => setIsExploreOpen(false)}
                  className="w-16 flex flex-col items-center justify-center h-full focus:outline-none group relative"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isVideoPage
                        ? isActive(navItems[4].href) ? 'bg-white/30 backdrop-blur-sm' : ''
                        : isActive(navItems[4].href)
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-slate-800'
                    }`}
                    style={isVideoPage ? {
                      filter: 'drop-shadow(0 0 1px #000) drop-shadow(0 0 2px rgba(0,0,0,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                    } : undefined}
                  >
                    <User className={`w-5 h-5 ${isVideoPage ? 'text-white' : ''}`} strokeWidth={isVideoPage ? 2.5 : 2} />
                  </div>
                  <span 
                    className={`text-[10px] font-medium mt-1 ${
                      isVideoPage
                        ? 'text-white font-semibold'
                        : isActive(navItems[4].href)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={isVideoPage ? { textShadow: '0 0 2px #000, 0 0 4px #000, 0 0 6px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.9)' } : undefined}
                  >
                    Profile
                  </span>
                  {isActive(navItems[4].href) && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className={`absolute -bottom-0 w-6 h-0.5 rounded-full ${isVideoPage ? 'bg-white' : 'bg-indigo-500'}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <ExploreMenu isOpen={isExploreOpen} onClose={handleCloseExplore} />

      <div className="h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </>
  );
}
