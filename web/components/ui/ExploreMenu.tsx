'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  BookOpen,
  Trophy,
  ClipboardCheck,
  Zap,
  Lightbulb,
  Users,
  MessageCircle,
  TrendingUp,
  Wallet,
  ShoppingBag,
  LogOut,
  Sparkles,
} from 'lucide-react';

const menuLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500' },
  { href: '/insight-school', label: 'Learn', icon: BookOpen, color: 'text-purple-500' },
  { href: '/challenges', label: 'Challenges', icon: Trophy, color: 'text-yellow-500' },
  { href: '/assessments', label: 'Assess', icon: ClipboardCheck, color: 'text-pink-500' },
  { href: '/insights', label: 'Insights', icon: Zap, color: 'text-orange-500' },
  { href: '/coach', label: 'Coach', icon: Lightbulb, color: 'text-amber-500' },
  { href: '/groups', label: 'Groups', icon: Users, color: 'text-cyan-500' },
  { href: '/messages', label: 'Messages', icon: MessageCircle, color: 'text-indigo-500' },
  { href: '/leaderboard', label: 'Leaders', icon: TrendingUp, color: 'text-emerald-500' },
  { href: '/wallet', label: 'Wallet', icon: Wallet, color: 'text-violet-500' },
  { href: '/marketplace', label: 'Shop', icon: ShoppingBag, color: 'text-rose-500' },
];

interface ExploreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExploreMenu({ isOpen, onClose }: ExploreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

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

  function handleLogout() {
    localStorage.removeItem('demo_user_id');
    window.location.href = '/';
  }

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
            className="fixed bottom-20 left-2 right-2 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Explore
                </h3>
                <p className="text-xs text-white/80">All features</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="p-2 grid grid-cols-4 gap-1" aria-label="Feature navigation">
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
                      className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform ${link.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="p-2 border-t border-gray-200 dark:border-slate-700">
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              ) : (
                <Link
                  href="/onboarding"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
