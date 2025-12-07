'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="font-bold text-xl text-white flex items-center gap-2 mb-4">
              <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">A</span>
              Akorfa
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              A platform for human development assessment and self-discovery. 
              Explore your seven layers, calculate your stability, and connect with others on the path to growth.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/assessments" className="hover:text-white transition-colors">
                  Assessments
                </Link>
              </li>
              <li>
                <Link href="/stability" className="hover:text-white transition-colors">
                  Stability Calculator
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
            <h3 className="font-semibold text-white mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Create Account
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

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Akorfa. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
