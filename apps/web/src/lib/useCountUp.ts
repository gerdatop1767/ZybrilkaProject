import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

/**
 * Animates a numeric value from 0 up to `target` on mount (or whenever
 * `target` changes), instead of the number/progress-fill just
 * appearing at its final value — the "XP/progress feedback animates"
 * step of the core loop (Design Spec Section 6). Snaps straight to
 * `target` under `prefers-reduced-motion`.
 */
export function useCountUp(target: number, durationMs = 600): number {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease-out cubic — fast start, settles gently, matching --easing-standard's feel.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, reducedMotion]);

  return reducedMotion ? target : value;
}
