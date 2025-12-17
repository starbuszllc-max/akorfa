'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ResponsiveMainContent({ children }: { children: React.ReactNode }) {
  const [headerHeight, setHeaderHeight] = useState(84);
  const pathname = usePathname();
  
  // Exclude pages where header shouldn't affect content
  const excludedPaths = ['/', '/create'];
  const shouldRespond = !excludedPaths.includes(pathname);

  useEffect(() => {
    const handleHeaderChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newHeight = customEvent.detail?.height || 84;
      setHeaderHeight(newHeight);
    };

    window.addEventListener('headerStateChanged', handleHeaderChange);
    return () => window.removeEventListener('headerStateChanged', handleHeaderChange);
  }, []);

  return (
    <main 
      className="flex-1 pb-16 transition-all duration-300" 
      style={{ 
        paddingTop: shouldRespond ? `${headerHeight}px` : '0px'
      }}
    >
      {children}
    </main>
  );
}
