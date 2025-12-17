'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const [headerHeight, setHeaderHeight] = useState(84);
  
  useEffect(() => {
    const handleHeaderChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setHeaderHeight(customEvent.detail?.height || 84);
    };
    
    window.addEventListener('headerStateChanged', handleHeaderChange);
    return () => window.removeEventListener('headerStateChanged', handleHeaderChange);
  }, []);
  
  if (pathname === '/' || pathname === '/create') {
    return null;
  }
  
  return (
    <>
      <Header />
    </>
  );
}
