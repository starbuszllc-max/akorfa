'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ProgressHUD from './ProgressHUD';

const HIDDEN_PATHS = ['/onboarding', '/login', '/signup', '/logout', '/notifications'];

export default function ProgressHUDWrapper() {
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const id = localStorage.getItem('demo_user_id');
    setUserId(id);
  }, []);

  if (!mounted) return null;

  const shouldHide = HIDDEN_PATHS.includes(pathname) || pathname.startsWith('/profile/');

  if (shouldHide) {
    return null;
  }

  if (!userId) {
    return null;
  }

  return <ProgressHUD userId={userId} isVisible={true} />;
}
