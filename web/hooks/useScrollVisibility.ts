'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseScrollVisibilityOptions {
  threshold?: number;
  initialVisible?: boolean;
}

export function useScrollVisibility(options: UseScrollVisibilityOptions = {}) {
  const { threshold = 24, initialVisible = true } = options;
  const [isVisible, setIsVisible] = useState(initialVisible);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateVisibility = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY.current;

    if (currentScrollY <= 10) {
      setIsVisible(true);
    } else if (scrollDelta > threshold) {
      setIsVisible(false);
      lastScrollY.current = currentScrollY;
    } else if (scrollDelta < -threshold) {
      setIsVisible(true);
      lastScrollY.current = currentScrollY;
    }

    ticking.current = false;
  }, [threshold]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateVisibility);
      ticking.current = true;
    }
  }, [updateVisibility]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return isVisible;
}
