// src/hooks/use-intersection-observer.ts
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Custom hook for detecting when an element intersects with the viewport
 * Used for implementing infinite scrolling and lazy loading
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  enabled = true,
}: UseIntersectionObserverProps = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const ref = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsIntersecting(false);
      return;
    }

    // Disconnect previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create new observer with the given options
    observer.current = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    // Observe the target element
    const currentElement = ref.current;
    if (currentElement) {
      observer.current.observe(currentElement);
    }

    // Cleanup when component unmounts or ref changes
    return () => {
      if (observer.current && currentElement) {
        observer.current.unobserve(currentElement);
        observer.current.disconnect();
      }
    };
  }, [threshold, rootMargin, enabled]);

  return { ref, entry, isIntersecting };
}