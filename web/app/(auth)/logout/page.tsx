'use client';
import React, {useEffect} from 'react';
import {supabaseClient} from '../../../lib/supabaseClient';

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      await supabaseClient.auth.signOut();
      // redirect to home
      window.location.href = '/';
    })();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6">
      <p className="text-gray-600">Signing out…</p>
    </div>
  );
}
