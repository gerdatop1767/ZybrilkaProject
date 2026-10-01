import { describe, expect, it } from 'vitest';
import { calculateSkillMastery, type SkillAttemptRecord } from './mastery.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME = new Date('2026-01-01T00:00:00Z').getTime();

/** `offsetDays` ago from a fixed base time, so test attempts have a stable, readable order. */
function attempt(isCorrect: boolean, offsetDays: number): SkillAttemptRecord {
  return { isCorrect, createdAt: new Date(BASE_TIME - offsetDays * DAY_MS) };
}

function series(pattern: readonly boolean[]): SkillAttemptRecord[] {
  // pattern[0] is oldest; each subsequent entry is one day more recent.
  return pattern.map((isCorrect, i) => attempt(isCorrect, pattern.length - i));
}

describe('calculateSkillMastery', () => {
  it('0 attempts -> mastery 0, confidence 0, no lastAttemptAt', () => {
    const result = calculateSkillMastery([]);
    expect(result).toEqual({
      attempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      mastery: 0,
      confidence: 0,
      lastAttemptAt: null,
    });
  });

  it('1 correct out of 1 does NOT give mastery 100 (low confidence caps it)', () => {
    const result = calculateSkillMastery(series([true]));
    expect(result.attempts).toBe(1);
    expect(result.correctAttempts).toBe(1);
    expect(result.confidence).toBe(10);
    expect(result.mastery).toBe(10);
    expect(result.mastery).toBeLessThan(100);
  });

  it('1 incorrect out of 1 gives mastery 0', () => {
    const result = calculateSkillMastery(series([false]));
    expect(result.mastery).toBe(0);
    expect(result.confidence).toBe(10);
  });

  it('5/10 gives a mid-range mastery with full confidence', () => {
    const result = calculateSkillMastery(
      series([true, false, true, false, true, false, true, false, true, false]),
    );
    expect(result.attempts).toBe(10);
    expect(result.correctAttempts).toBe(5);
    expect(result.confidence).toBe(100);
    expect(result.mastery).toBe(50);
  });

  it('9/10 gives a high but non-absolute mastery', () => {
    const result = calculateSkillMastery(
      series([true, true, true, true, true, true, true, true, true, false]),
    );
    expect(result.mastery).toBe(90);
    expect(result.mastery).toBeLessThan(100);
    expect(result.confidence).toBe(100);
  });

  it('10/10 gives the maximum mastery', () => {
    const result = calculateSkillMastery(series(Array(10).fill(true)));
    expect(result.mastery).toBe(100);
    expect(result.confidence).toBe(100);
  });

  it('0/10 gives mastery 0 with full confidence', () => {
    const result = calculateSkillMastery(series(Array(10).fill(false)));
    expect(result.mastery).toBe(0);
    expect(result.confidence).toBe(100);
  });

  it('a recent error streak after an older correct streak pulls mastery down (recency, not just lifetime average)', () => {
    // 10 correct (older) then 5 incorrect (recent) = 15 total, lifetime
    // accuracy 10/15 = 67%, but the last-10-attempt window is
    // [5 correct, 5 incorrect] = 50% — recency must win, not lifetime.
    const olderCorrect = Array.from({ length: 10 }, (_, i) => attempt(true, 20 - i));
    const recentWrong = Array.from({ length: 5 }, (_, i) => attempt(false, 5 - i));
    const result = calculateSkillMastery([...olderCorrect, ...recentWrong]);
    expect(result.attempts).toBe(15);
    expect(result.correctAttempts).toBe(10);
    expect(result.incorrectAttempts).toBe(5);
    expect(result.confidence).toBe(100);
    expect(result.mastery).toBe(50);
    // Sanity: the naive lifetime-average would have been 67, not 50 —
    // confirms recency is actually doing something, not a no-op.
    const naiveLifetimeAverage = Math.round((result.correctAttempts / result.attempts) * 100);
    expect(result.mastery).not.toBe(naiveLifetimeAverage);
  });

  it('old correct attempts outside the recency window no longer prop up mastery once dropped', () => {
    // 20 correct (ancient) then 10 incorrect (recent) -> window is all 10 incorrect.
    const oldCorrect = Array.from({ length: 20 }, (_, i) => attempt(true, 100 - i));
    const recentWrong = Array.from({ length: 10 }, (_, i) => attempt(false, 10 - i));
    const result = calculateSkillMastery([...oldCorrect, ...recentWrong]);
    expect(result.attempts).toBe(30);
    expect(result.mastery).toBe(0);
    expect(result.confidence).toBe(100);
  });

  it('is order-independent at the input level (sorts internally, same result regardless of input order)', () => {
    const chronological = series([true, false, true, true, false, true, true, true, true, false]);
    const shuffled = [...chronological].reverse();
    expect(calculateSkillMastery(shuffled)).toEqual(calculateSkillMastery(chronological));
  });

  it('recomputing with the exact same attempts gives the exact same result (idempotent)', () => {
    const attempts = series([true, true, false, true, true, true, false, true]);
    const first = calculateSkillMastery(attempts);
    const second = calculateSkillMastery(attempts);
    expect(second).toEqual(first);
  });

  it('mastery never leaves [0, 100] across a wide range of inputs', () => {
    for (let correct = 0; correct <= 20; correct++) {
      for (let incorrect = 0; incorrect <= 20; incorrect++) {
        if (correct + incorrect === 0) continue;
        const pattern = [...Array(correct).fill(true), ...Array(incorrect).fill(false)];
        const result = calculateSkillMastery(series(pattern));
        expect(result.mastery).toBeGreaterThanOrEqual(0);
        expect(result.mastery).toBeLessThanOrEqual(100);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    }
  });

  it('confidence scales monotonically with attempt count up to the threshold, never decreasing', () => {
    let previousConfidence = -1;
    for (let n = 1; n <= 12; n++) {
      const result = calculateSkillMastery(series(Array(n).fill(true)));
      expect(result.confidence).toBeGreaterThanOrEqual(previousConfidence);
      previousConfidence = result.confidence;
    }
  });

  it('confidence caps at 100 once attempts reach the threshold, never grows past it', () => {
    const at10 = calculateSkillMastery(series(Array(10).fill(true)));
    const at50 = calculateSkillMastery(series(Array(50).fill(true)));
    expect(at10.confidence).toBe(100);
    expect(at50.confidence).toBe(100);
  });

  it('tracks lastAttemptAt as the most recent attempt, regardless of input order', () => {
    const oldest = attempt(true, 10);
    const newest = attempt(false, 1);
    const middle = attempt(true, 5);
    const result = calculateSkillMastery([middle, oldest, newest]);
    expect(result.lastAttemptAt).toEqual(newest.createdAt);
  });
});
