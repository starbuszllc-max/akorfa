'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  const hideFooterPaths = ['/', '/live'];
  const shouldHideFooter = hideFooterPaths.includes(pathname);

  useEffect(() => {
    const userId = localStorage.getItem('demo_user_id');
    setIsLoggedIn(!!userId);
  }, []);

  if (shouldHideFooter) {
    return null;
  }

  return (
    <footer className="w-full bg-gray-900 dark:bg-slate-950 text-gray-300 mt-auto">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="col-span-2">
            <Link href="/" className="font-bold text-base md:text-lg text-white flex items-center gap-1.5 mb-2">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-md flex items-center justify-center text-xs">A</span>
              Akorfa
            </Link>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm">
              A platform for human development assessment and self-discovery. 
              Explore your seven layers, calculate your stability, and connect with others on the path to growth.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white text-sm mb-2 md:mb-3">Platform</h3>
            <ul className="space-y-1 text-xs md:text-sm">
              <li>
                <Link href="/assessments" className="hover:text-white transition-colors">
                  Assessments
                </Link>
              </li>
              <li>
                <Link href="/insights" className="hover:text-white transition-colors">
                  Daily Insights
                </Link>
              </li>
              <li>
                <Link href="/challenges" className="hover:text-white transition-colors">
                  Challenges
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-white transition-colors">
                  Community Feed
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white text-sm mb-2 md:mb-3">{isLoggedIn ? 'Your Space' : 'Get Started'}</h3>
            <ul className="space-y-1 text-xs md:text-sm">
              <li>
                <Link href={isLoggedIn ? "/dashboard" : "/onboarding"} className="hover:text-white transition-colors">
                  {isLoggedIn ? 'Dashboard' : 'Start Journey'}
                </Link>
              </li>
              <li>
                <Link href="/coach" className="hover:text-white transition-colors">
                  AI Coach
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Your Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-4 md:mt-6 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} Akorfa. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Made for human growth
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
