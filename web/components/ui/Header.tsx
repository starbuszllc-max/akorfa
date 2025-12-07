'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const supabase = supabaseClient();
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  async function handleLogout() {
    try {
      await supabaseClient().auth.signOut();
      window.location.href = '/';
    } catch (e) {
      window.location.href = '/';
    }
  }

  const navLinks = user ? [
    { href: '/feed', label: 'Feed' },
    { href: '/assessments', label: 'Assess' },
    { href: '/stability', label: 'Stability' },
    { href: '/profile', label: 'Profile' },
  ] : [
    { href: '/assessments', label: 'Assess' },
    { href: '/stability', label: 'Stability' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-indigo-600 flex items-center gap-2">
          <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">A</span>
          Akorfa
        </Link>
        
        <button 
          className="md:hidden p-2 text-gray-600"
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

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href) 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="w-px h-6 bg-gray-200 mx-2"></div>
          
          {loading ? (
            <span className="text-sm text-gray-400 px-4">...</span>
          ) : user ? (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-gray-200 my-2"></div>
            
            {loading ? null : user ? (
              <button 
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg text-left"
              >
                Logout
              </button>
            ) : (
              <>
                <Link 
                  href="/login" 
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
