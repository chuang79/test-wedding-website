'use client';
import { useEffect } from 'react';

export default function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const previousBehavior = root.style.scrollBehavior;

    if (!reduced) {
      root.style.scrollBehavior = 'smooth';
    }

    return () => {
      root.style.scrollBehavior = previousBehavior;
    };
  }, []);

  return null;
}
