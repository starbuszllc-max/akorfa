'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, TrendingUp } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [balance, setBalance] = useState(0);
  const pathname = usePathname();

  const isCollapsed = scrollY > 100;

  useEffect(() => {
    const demoUserId = localStorage.getItem('demo_user_id');
    if (demoUserId) {
      setUser({ id: demoUserId, demo: true });
      fetchProfileData(demoUserId);
    }
    setLoading(false);
  }, []);

  const fetchProfileData = async (userId: string) => {
    try {
      const [profileRes, assessmentRes] = await Promise.all([
        fetch(`/api/profiles?userId=${userId}`),
        fetch(`/api/assessments?userId=${userId}`)
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setScore(data.profile?.akorfaScore || 0);
      }
      if (assessmentRes.ok) {
        const assessData = await assessmentRes.json();
        if (assessData.assessments && assessData.assessments.length > 0) {
          const scores = (assessData.assessments[0].layerScores || assessData.assessments[0].layer_scores || {}) as Record<string, number>;
          const values = Object.values(scores);
          const avg = values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;
          setBalance(avg);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLogout() {
    localStorage.removeItem('demo_user_id');
    window.location.href = '/';
  }

  const navLinks = user ? [
    { href: '/dashboard', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )},
    { href: '/feed', label: 'Feed', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    )},
    { href: '/insight-school', label: 'Learn', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { href: '/ai-mentor', label: 'Mentor', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )},
    { href: '/daily-challenges', label: 'Daily', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { href: '/discover', label: 'Discover', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { href: '/create', label: 'Create', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { href: '/challenges', label: 'Challenges', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    )},
    { href: '/referrals', label: 'Invite', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    )},
    { href: '/groups', label: 'Groups', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { href: '/wallet', label: 'Wallet', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { href: '/profile', label: 'Profile', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
  ] : [
    { href: '/insight-school', label: 'Learn', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { href: '/challenges', label: 'Challenges', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    )},
    { href: '/assessments', label: 'Assess', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )},
    { href: '/stability', label: 'Stability', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className={`w-full bg-gradient-to-r from-white via-green-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-md sticky top-0 z-50 border-b border-green-200/30 dark:border-green-900/20 transition-all duration-300 ease-out`} style={{ height: isCollapsed ? '48px' : '84px' }}>
      <div className={`max-w-7xl mx-auto flex items-center justify-between gap-4 transition-all duration-300 ${isCollapsed ? 'px-4' : ''}`} style={{ paddingTop: isCollapsed ? '0px' : '8px', paddingBottom: isCollapsed ? '0px' : '12px', paddingLeft: isCollapsed ? '16px' : '0px', paddingRight: '5px', height: isCollapsed ? '48px' : '84px', display: 'flex', alignItems: 'center' }}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity duration-200" style={{ paddingLeft: '12px' }}>
            <img 
              src="/logo.png" 
              alt="Akorfa" 
              className="w-auto h-12 md:h-16"
            />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg md:text-xl bg-gradient-to-r from-green-700 via-green-600 to-green-700 dark:from-green-400 dark:via-green-300 dark:to-green-400 bg-clip-text text-transparent">
                Akorfa
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Human Stack</p>
            </div>
          </Link>
        )}

        {isCollapsed && (
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold text-green-700 dark:text-green-300">{Math.round(score)}</span>
              <span className="text-[10px] text-green-600 dark:text-green-400">Score</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{balance}%</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">Balance</span>
            </div>
          </div>
        )}
        
        {!isCollapsed && (
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button 
              className="p-1.5 text-gray-600 dark:text-gray-300"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        )}

        <nav className={`${isCollapsed ? 'hidden' : 'hidden md:flex'} items-center gap-0.5`}>
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isActive(link.href) 
                  ? 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {link.icon}
              <span className="hidden lg:inline">{link.label}</span>
            </Link>
          ))}
          
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1"></div>
          
          {user && <NotificationBell />}
          <ThemeToggle />
          
          {loading ? (
            <span className="text-xs text-gray-400 px-2">...</span>
          ) : user ? (
            <button 
              onClick={handleLogout}
              className="px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <Link 
                href="/signup" 
                className="px-3 py-1.5 text-xs font-medium bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <nav className="flex flex-col p-3 gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive(link.href) 
                    ? 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-gray-200 dark:bg-slate-700 my-1"></div>
            
            {loading ? null : user ? (
              <button 
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-md text-left"
              >
                Logout
              </button>
            ) : (
              <Link 
                href="/signup" 
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium bg-green-600 dark:bg-green-500 text-white rounded-md text-center"
              >
                Get Started
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
