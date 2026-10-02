import { describe, expect, it } from 'vitest';
import { calculateTaskDifficulty, type TaskAttemptRecord } from './taskDifficulty.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME = new Date('2026-01-01T00:00:00Z').getTime();

function attempt(
  isCorrect: boolean,
  offsetDays: number,
  timeSpentMs?: number | null,
): TaskAttemptRecord {
  return { isCorrect, createdAt: new Date(BASE_TIME - offsetDays * DAY_MS), timeSpentMs };
}

function series(pattern: readonly boolean[]): TaskAttemptRecord[] {
  return pattern.map((isCorrect, i) => attempt(isCorrect, pattern.length - i));
}

describe('calculateTaskDifficulty', () => {
  it('0 attempts -> cold start: difficulty and accuracy are null, confidence 0', () => {
    const result = calculateTaskDifficulty([]);
    expect(result).toEqual({
      attempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: null,
      difficulty: null,
      confidence: 0,
      averageTimeMs: null,
      lastAttemptAt: null,
    });
  });

  it('1 correct out of 1 does NOT read as maximally easy (shrinks toward the neutral 50, not 0)', () => {
    const result = calculateTaskDifficulty(series([true]));
    expect(result.attempts).toBe(1);
    expect(result.accuracy).toBe(100);
    expect(result.confidence).toBe(10);
    expect(result.difficulty).toBe(45);
  });

  it('1 incorrect out of 1 does NOT read as maximally difficult (shrinks toward the neutral 50, not 100)', () => {
    const result = calculateTaskDifficulty(series([false]));
    expect(result.accuracy).toBe(0);
    expect(result.confidence).toBe(10);
    expect(result.difficulty).toBe(55);
    expect(result.difficulty).toBeLessThan(100);
  });

  it('5 attempts, all correct -> moderate confidence, difficulty well below neutral', () => {
    const result = calculateTaskDifficulty(series([true, true, true, true, true]));
    expect(result.attempts).toBe(5);
    expect(result.confidence).toBe(50);
    expect(result.difficulty).toBe(25);
  });

  it('10/10 correct with full confidence gives low difficulty (easy task, well-evidenced)', () => {
    const result = calculateTaskDifficulty(series(Array(10).fill(true)));
    expect(result.confidence).toBe(100);
    expect(result.accuracy).toBe(100);
    expect(result.difficulty).toBe(0);
  });

  it('0/10 with full confidence gives maximum difficulty (hard task, well-evidenced)', () => {
    const result = calculateTaskDifficulty(series(Array(10).fill(false)));
    expect(result.confidence).toBe(100);
    expect(result.accuracy).toBe(0);
    expect(result.difficulty).toBe(100);
  });

  it('5/10 gives a mid-range difficulty with full confidence', () => {
    const result = calculateTaskDifficulty(
      series([true, false, true, false, true, false, true, false, true, false]),
    );
    expect(result.attempts).toBe(10);
    expect(result.correctAttempts).toBe(5);
    expect(result.confidence).toBe(100);
    expect(result.accuracy).toBe(50);
    expect(result.difficulty).toBe(50);
  });

  it('9/10 correct gives low difficulty, not zero (one real failure still counts)', () => {
    const result = calculateTaskDifficulty(
      series([true, true, true, true, true, true, true, true, true, false]),
    );
    expect(result.accuracy).toBe(90);
    expect(result.confidence).toBe(100);
    expect(result.difficulty).toBe(10);
  });

  it('confidence stays within [0, 100]', () => {
    for (const n of [0, 1, 5, 10, 20, 100]) {
      const result = calculateTaskDifficulty(series(Array(n).fill(true)));
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('difficulty stays within [0, 100] (or null) across a wide range of inputs', () => {
    for (let correct = 0; correct <= 15; correct++) {
      for (let incorrect = 0; incorrect <= 15; incorrect++) {
        if (correct + incorrect === 0) continue;
        const pattern = [...Array(correct).fill(true), ...Array(incorrect).fill(false)];
        const result = calculateTaskDifficulty(series(pattern));
        expect(result.difficulty).not.toBeNull();
        expect(result.difficulty!).toBeGreaterThanOrEqual(0);
        expect(result.difficulty!).toBeLessThanOrEqual(100);
      }
    }
  });

  it('cold start never returns a fabricated 50 — explicitly null, distinct from a real neutral result', () => {
    const coldStart = calculateTaskDifficulty([]);
    const oneAttemptNeutral = calculateTaskDifficulty(series([true]));
    expect(coldStart.difficulty).toBeNull();
    expect(oneAttemptNeutral.difficulty).not.toBeNull();
  });

  it('recomputing with the exact same attempts gives the exact same result (idempotent)', () => {
    const attempts = series([true, true, false, true, false, true, true, false]);
    const first = calculateTaskDifficulty(attempts);
    const second = calculateTaskDifficulty(attempts);
    expect(second).toEqual(first);
  });

  it('is order-independent at the input level (sorts internally)', () => {
    const chronological = series([true, false, true, true, false, true, true, true, true, false]);
    const shuffled = [...chronological].reverse();
    expect(calculateTaskDifficulty(shuffled)).toEqual(calculateTaskDifficulty(chronological));
  });

  it('more evidence never decreases confidence, for the same accuracy', () => {
    let previous = -1;
    for (let n = 1; n <= 15; n++) {
      // keep accuracy fixed at 100% while attempts grows
      const result = calculateTaskDifficulty(series(Array(n).fill(true)));
      expect(result.confidence).toBeGreaterThanOrEqual(previous);
      previous = result.confidence;
    }
  });

  it('at a fixed attempt count, lower accuracy never produces lower difficulty (monotonic)', () => {
    let previousDifficulty = -1;
    // 10 attempts, correctAttempts decreasing from 10 to 0 -> accuracy decreasing -> difficulty must never decrease
    for (let correct = 10; correct >= 0; correct--) {
      const pattern = [...Array(correct).fill(true), ...Array(10 - correct).fill(false)];
      const result = calculateTaskDifficulty(series(pattern));
      expect(result.difficulty!).toBeGreaterThanOrEqual(previousDifficulty);
      previousDifficulty = result.difficulty!;
    }
  });

  describe('averageTimeMs', () => {
    it('is null when no attempt carries a time', () => {
      const result = calculateTaskDifficulty([
        attempt(true, 1, null),
        attempt(false, 2, undefined),
      ]);
      expect(result.averageTimeMs).toBeNull();
    });

    it('averages only the attempts that do carry a time, ignoring nulls', () => {
      const result = calculateTaskDifficulty([
        attempt(true, 3, 1000),
        attempt(true, 2, null),
        attempt(false, 1, 3000),
      ]);
      expect(result.averageTimeMs).toBe(2000);
    });

    it('a single extreme outlier does not crash or corrupt the rest of the statistics', () => {
      const result = calculateTaskDifficulty([
        attempt(true, 5, 1000),
        attempt(true, 4, 1200),
        attempt(true, 3, 900),
        attempt(false, 2, 999_999_999),
      ]);
      expect(result.attempts).toBe(4);
      expect(result.correctAttempts).toBe(3);
      expect(Number.isFinite(result.averageTimeMs)).toBe(true);
      expect(result.difficulty).not.toBeNull();
      expect(result.difficulty!).toBeGreaterThanOrEqual(0);
      expect(result.difficulty!).toBeLessThanOrEqual(100);
    });
  });

  it('tracks lastAttemptAt as the most recent attempt, regardless of input order', () => {
    const oldest = attempt(true, 10);
    const newest = attempt(false, 1);
    const middle = attempt(true, 5);
    const result = calculateTaskDifficulty([middle, oldest, newest]);
    expect(result.lastAttemptAt).toEqual(newest.createdAt);
  });
});
