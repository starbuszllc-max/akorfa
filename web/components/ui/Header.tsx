'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabaseClient';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-primary-600">Akorfa</Link>
        <nav className="space-x-4 flex items-center">
          <Link href="/assessments" className="text-sm text-text-secondary hover:text-primary-600">Assess</Link>
          <Link href="/stability" className="text-sm text-text-secondary hover:text-primary-600">Stability</Link>
          <Link href="/profile" className="text-sm text-text-secondary hover:text-primary-600">Profile</Link>
          <Link href="/admin/assessments" className="text-sm text-text-secondary hover:text-primary-600">Admin</Link>
          {loading ? (
            <span className="text-sm text-gray-400">...</span>
          ) : user ? (
            <button 
              onClick={handleLogout}
              className="text-sm text-text-secondary hover:text-primary-600"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-sm text-text-secondary hover:text-primary-600">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
