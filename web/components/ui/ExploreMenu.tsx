'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Zap,
  Lightbulb,
  Users,
  MessageCircle,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Sparkles,
  Newspaper,
  Compass,
  Bell,
  Camera,
  Trophy,
  Video,
  Clapperboard,
} from 'lucide-react';

const menuLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  { href: '/news', label: 'News', icon: Newspaper, color: 'text-red-500' },
  { href: '/discover', label: 'Discover', icon: Compass, color: 'text-teal-500' },
  { href: '/insight-school', label: 'Learn', icon: BookOpen, color: 'text-purple-500' },
  { href: '/assessments', label: 'Assess', icon: ClipboardCheck, color: 'text-pink-500' },
  { href: '/insights', label: 'Insights', icon: Zap, color: 'text-orange-500' },
  { href: '/coach', label: 'Coach', icon: Lightbulb, color: 'text-green-500' },
  { href: '/groups', label: 'Groups', icon: Users, color: 'text-cyan-500' },
  { href: '/messages', label: 'Messages', icon: MessageCircle, color: 'text-green-500' },
  { href: '/leaderboard', label: 'Leaders', icon: TrendingUp, color: 'text-emerald-500' },
  { href: '/wallet', label: 'Wallet', icon: Wallet, color: 'text-violet-500' },
  { href: '/marketplace', label: 'Shop', icon: ShoppingBag, color: 'text-rose-500' },
];

interface ExploreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  followerCount?: number;
}

export default function ExploreMenu({ isOpen, onClose, followerCount = 0 }: ExploreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const showLiveButton = followerCount >= 500;

  useEffect(() => {
    const demoUserId = localStorage.getItem('demo_user_id');
    if (demoUserId) {
      setUser({ id: demoUserId, demo: true });
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      const firstLink = menuRef.current?.querySelector('a, button') as HTMLElement;
      firstLink?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Explore menu"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-green-500/20 via-green-600/15 to-emerald-700/10 backdrop-blur-xl border border-green-400/30"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Explore
                </h3>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Link href="/studio" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-green-500/30 to-purple-500/30 rounded-xl hover:from-green-500/40 hover:to-purple-500/40 transition-all">
                  <Clapperboard className="w-4 h-4" />
                  <span className="text-sm font-medium">Media Studio</span>
                </Link>
                <Link href="/stories" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">View Stories</span>
                </Link>
                <Link href="/challenges" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">Challenges</span>
                </Link>
                <Link href="/coach" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">AI Coach</span>
                </Link>
                {showLiveButton && (
                  <Link href="/live" onClick={onClose} className="flex items-center gap-2 px-3 py-2.5 bg-red-500/30 rounded-xl hover:bg-red-500/40 transition-all col-span-2">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Go Live</span>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Link href="/messages" onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Messages</span>
                </Link>
                <Link href="/notifications" onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">Notifications</span>
                </Link>
              </div>
            </div>

            <nav className="p-4 grid grid-cols-4 gap-3" aria-label="Feature navigation">
              {menuLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex flex-col items-center p-3 rounded-2xl transition-all group focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <Icon className="w-6 h-6 text-white mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white text-center leading-relaxed tracking-wide">
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {!user && (
              <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/30">
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-green-500 to-purple-500 text-white rounded-2xl hover:from-green-600 hover:to-purple-600 transition-all shadow-lg shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
