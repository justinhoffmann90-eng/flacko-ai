"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
  minimum: 0.1,
});

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}

// Hook to trigger progress bar on link clicks
export function useProgressBar() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        const isInternal = href?.startsWith('/') || href?.startsWith('#');
        const isSameOrigin = anchor.origin === window.location.origin;
        const isNewTab = anchor.target === '_blank';
        
        if (href && isInternal && isSameOrigin && !isNewTab && !href.startsWith('#')) {
          NProgress.start();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
