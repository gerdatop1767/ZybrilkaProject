import { useCallback, useEffect, useRef, useState } from 'react';

export type SolvingTimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface SolvingTimer {
  readonly status: SolvingTimerStatus;
  /** Real elapsed solving time, in ms — never a tick count. Updated
   * from timestamps (see module doc), so it stays correct through
   * background tabs, throttled timers, or UI lag. */
  readonly elapsedMs: number;
  /** No-op once already running/paused/finished — the timer only ever
   * starts once per task (a fresh `key={taskId}` mount gives a fresh
   * timer for the next one). */
  start(): void;
  pause(): void;
  resume(): void;
  /** Freezes the timer (idempotent) and returns the final elapsed ms —
   * callers use this return value directly rather than re-reading
   * `elapsedMs` after, so the value submitted is exactly what was
   * frozen, never a value computed a render later. */
  finish(): number;
}

/**
 * ZUBRILKA — a real, timestamp-based solving timer (never a
 * `setInterval(() => seconds++)` tick count, which would drift under
 * background tabs/throttling/Telegram WebView). `startedAtRef`/
 * `accumulatedMsRef` hold the raw timestamps; `elapsedMs` is ordinary
 * React state recomputed from them only inside event handlers and the
 * interval callback below — `Date.now()` is never called during
 * render, which this hook's own render body must stay pure.
 *
 * Does not auto-start on mount — opening a task is never "solving
 * time" until the user presses "Начать" (see `TaskDesktop`/
 * `TaskMobile`'s `useSolvingTimer()` call and `SolvingTimer` UI).
 */
export function useSolvingTimer(): SolvingTimer {
  const [status, setStatus] = useState<SolvingTimerStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const statusRef = useRef<SolvingTimerStatus>('idle');

  useEffect(() => {
    const id = setInterval(() => {
      if (statusRef.current !== 'running' || startedAtRef.current === null) return;
      setElapsedMs(accumulatedMsRef.current + (Date.now() - startedAtRef.current));
    }, 250);
    return () => clearInterval(id);
  }, []);

  const start = useCallback(() => {
    if (statusRef.current !== 'idle') return;
    startedAtRef.current = Date.now();
    accumulatedMsRef.current = 0;
    statusRef.current = 'running';
    setStatus('running');
    setElapsedMs(0);
  }, []);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    accumulatedMsRef.current += Date.now() - (startedAtRef.current ?? Date.now());
    startedAtRef.current = null;
    statusRef.current = 'paused';
    setStatus('paused');
    setElapsedMs(accumulatedMsRef.current);
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    startedAtRef.current = Date.now();
    statusRef.current = 'running';
    setStatus('running');
  }, []);

  const finish = useCallback((): number => {
    if (statusRef.current === 'finished') return accumulatedMsRef.current;
    const final =
      statusRef.current === 'running'
        ? accumulatedMsRef.current + (Date.now() - (startedAtRef.current ?? Date.now()))
        : accumulatedMsRef.current;
    accumulatedMsRef.current = final;
    startedAtRef.current = null;
    statusRef.current = 'finished';
    setStatus('finished');
    setElapsedMs(final);
    return final;
  }, []);

  return { status, elapsedMs, start, pause, resume, finish };
}
