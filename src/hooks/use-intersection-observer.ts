// src/hooks/use-intersection-observer.ts (improved)
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  onIntersect?: () => void; // Optional callback when intersection occurs
  skip?: boolean; // Skip triggering while loading
}

/**
 * Enhanced hook for detecting when an element intersects with the viewport
 * Used for implementing infinite scrolling and lazy loading
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  enabled = true,
  onIntersect,
  skip = false,
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const ref = useRef<Element | null>(null);
  const onIntersectRef = useRef(onIntersect);
  
  // Update callback ref when onIntersect changes
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  // Cleanup function to properly disconnect observer
  const cleanup = useCallback(() => {
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
  }, []);

  // Setup observer
  const setupObserver = useCallback(() => {
    // Early return if disabled, already observing, or browser doesn't support IntersectionObserver
    if (!enabled || observer.current || typeof IntersectionObserver === 'undefined') {
      return;
    }

    cleanup();
    
    observer.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const newIsIntersecting = entry.isIntersecting;
        
        setIsIntersecting(newIsIntersecting);
        
        // Call onIntersect callback if element is intersecting and not skipping
        if (newIsIntersecting && onIntersectRef.current && !skip) {
          onIntersectRef.current();
        }
      },
      { threshold, rootMargin }
    );

    const currentElement = ref.current;
    if (currentElement) {
      observer.current.observe(currentElement);
    }
  }, [threshold, rootMargin, enabled, skip, cleanup]);
  
  // Setup the observer when the ref changes
  const setRef = useCallback((node: Element | null) => {
    if (ref.current) {
      cleanup();
    }
    
    ref.current = node;
    
    if (node) {
      setupObserver();
    }
  }, [setupObserver, cleanup]);

  // Handle enabled/disabled state changes
  useEffect(() => {
    if (!enabled) {
      cleanup();
      setIsIntersecting(false);
    } else if (ref.current && !observer.current) {
      setupObserver();
    }
    
    return cleanup;
  }, [enabled, setupObserver, cleanup]);

  // Fallback for browsers without IntersectionObserver
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' && enabled && onIntersectRef.current && !skip) {
      const fallbackInterval = setInterval(() => {
        // Simple fallback that checks if element is near bottom of viewport
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight + 300; // 300px before element becomes visible
          if (isVisible && onIntersectRef.current) {
            onIntersectRef.current();
          }
        }
      }, 1000);
      
      return () => clearInterval(fallbackInterval);
    }
  }, [enabled, skip]);

  return { ref: setRef, isIntersecting };
}