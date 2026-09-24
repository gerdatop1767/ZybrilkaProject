import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion` for JS-driven animations (rAF loops,
 * count-ups) that CSS media queries alone can't cover — CSS animation
 * durations already zero out via tokens.css; this is the JS-side twin.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setReduced(query.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reduced;
}
