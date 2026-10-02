import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSolvingTimer } from './useSolvingTimer.js';

describe('useSolvingTimer (real solving timer — ZUBRILKA)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function tick(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('1. initial elapsed is 0 and status is idle', () => {
    const { result } = renderHook(() => useSolvingTimer());
    expect(result.current.status).toBe('idle');
    expect(result.current.elapsedMs).toBe(0);
  });

  it('2-3. start() begins running, and elapsed grows from real timestamps, not tick counting', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    tick(5000);
    expect(result.current.elapsedMs).toBe(5000);
    // A single large jump (simulating a throttled/backgrounded tab)
    // must be reflected exactly — never capped by a tick count.
    tick(55000);
    expect(result.current.elapsedMs).toBe(60000);
  });

  it('4. pause() freezes the elapsed value', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    tick(3000);
    act(() => result.current.pause());
    expect(result.current.status).toBe('paused');
    const frozen = result.current.elapsedMs;
    expect(frozen).toBe(3000);
    tick(10000); // time passes while paused
    expect(result.current.elapsedMs).toBe(frozen);
  });

  it('5. resume() continues accumulating from the paused value, not from 0', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    tick(2000);
    act(() => result.current.pause());
    tick(30000); // ignored while paused
    act(() => result.current.resume());
    expect(result.current.status).toBe('running');
    tick(1000);
    expect(result.current.elapsedMs).toBe(3000);
  });

  it('6. multiple pause/resume cycles accumulate correctly', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    tick(1000);
    act(() => result.current.pause());
    tick(5000);
    act(() => result.current.resume());
    tick(1000);
    act(() => result.current.pause());
    tick(5000);
    act(() => result.current.resume());
    tick(1000);
    expect(result.current.elapsedMs).toBe(3000);
  });

  it('7. finish() freezes the timer — subsequent time passing has no effect', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    tick(4000);
    let final = 0;
    act(() => {
      final = result.current.finish();
    });
    expect(result.current.status).toBe('finished');
    expect(final).toBe(4000);
    expect(result.current.elapsedMs).toBe(4000);
    tick(10000);
    expect(result.current.elapsedMs).toBe(4000);
    // start/pause/resume are no-ops once finished.
    act(() => result.current.start());
    expect(result.current.status).toBe('finished');
  });

  it('8. finish() excludes any paused time', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    tick(2000);
    act(() => result.current.pause());
    tick(100000); // long pause, must not count
    act(() => result.current.resume());
    tick(2000);
    let final = 0;
    act(() => {
      final = result.current.finish();
    });
    expect(final).toBe(4000);
  });

  it('9. a task never started (finish() called while idle) reports 0 elapsed — caller treats this as "no solving time"', () => {
    const { result } = renderHook(() => useSolvingTimer());
    let final = -1;
    act(() => {
      final = result.current.finish();
    });
    expect(final).toBe(0);
    expect(result.current.status).toBe('finished');
  });

  it('10. the exact elapsedMs returned by finish() is what a caller would submit', () => {
    const { result } = renderHook(() => useSolvingTimer());
    act(() => result.current.start());
    tick(12345);
    let submitted = -1;
    act(() => {
      submitted = result.current.finish();
    });
    expect(submitted).toBe(12345);
  });
});
