'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, LayoutDashboard, Newspaper, BookOpen, Trophy, ClipboardCheck, Zap, Lightbulb, Users, MessageCircle, TrendingUp, Wallet, ShoppingBag, User, LogOut, Sparkles, Camera, Video, Bell } from 'lucide-react';

const navLinks = [
  { href: '/stories', label: 'Stories', icon: Camera, color: 'text-pink-500' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  { href: '/feed', label: 'Feed', icon: Newspaper, color: 'text-green-500' },
  { href: '/live', label: 'Live', icon: Video, color: 'text-red-500' },
  { href: '/insight-school', label: 'Learn', icon: BookOpen, color: 'text-purple-500' },
  { href: '/challenges', label: 'Challenges', icon: Trophy, color: 'text-yellow-500' },
  { href: '/notifications', label: 'Alerts', icon: Bell, color: 'text-orange-500' },
  { href: '/insights', label: 'Insights', icon: Zap, color: 'text-amber-500' },
  { href: '/coach', label: 'Coach', icon: Lightbulb, color: 'text-teal-500' },
  { href: '/groups', label: 'Groups', icon: Users, color: 'text-cyan-500' },
  { href: '/messages', label: 'Messages', icon: MessageCircle, color: 'text-indigo-500' },
  { href: '/leaderboard', label: 'Leaders', icon: TrendingUp, color: 'text-emerald-500' },
  { href: '/wallet', label: 'Wallet', icon: Wallet, color: 'text-violet-500' },
  { href: '/marketplace', label: 'Shop', icon: ShoppingBag, color: 'text-rose-500' },
  { href: '/profile', label: 'Profile', icon: User, color: 'text-slate-500' },
];

export default function FloatingExploreButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const demoUserId = localStorage.getItem('demo_user_id');
    if (demoUserId) {
      setUser({ id: demoUserId, demo: true });
    }
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const firstLink = menuRef.current?.querySelector('a, button') as HTMLElement;
      firstLink?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  function handleLogout() {
    localStorage.removeItem('demo_user_id');
    window.location.href = '/';
  }

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="explore-menu"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeMenu}
              aria-hidden="true"
            />
            
            <motion.div
              ref={menuRef}
              id="explore-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-80 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
            >
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Explore Akorfa
                </h3>
                <p className="text-sm text-white/80 mt-1">Discover all features</p>
              </div>

              <nav className="p-3 grid grid-cols-3 gap-2" aria-label="Main navigation">
                {navLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform ${link.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{link.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                {user ? (
                  <button
                    onClick={() => { handleLogout(); closeMenu(); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Get Started
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
