import { describe, expect, it } from 'vitest';
import {
  MIN_SPEED_SAMPLE_SIZE,
  calculateMedian,
  calculateSpeedNeed,
  calculateSpeedSignal,
  selectSpeedBaseline,
  type SpeedBaselineSource,
} from './speedSignal.js';

function baseline(
  level: SpeedBaselineSource['level'],
  medianTimeMs: number,
  sampleSize: number,
): SpeedBaselineSource {
  return { level, medianTimeMs, sampleSize };
}

describe('calculateMedian', () => {
  it('returns null for an empty list', () => {
    expect(calculateMedian([])).toBeNull();
  });

  it('returns the single value for one element', () => {
    expect(calculateMedian([5000])).toBe(5000);
  });

  it('averages the two middle values for an even-length list', () => {
    expect(calculateMedian([1000, 3000])).toBe(2000);
  });

  it('is robust to one slow outlier (unlike a mean)', () => {
    expect(calculateMedian([10000, 11000, 12000, 100000])).toBe(11500);
  });

  it('does not depend on input order', () => {
    expect(calculateMedian([3000, 1000, 2000])).toBe(calculateMedian([1000, 2000, 3000]));
  });
});

describe('MIN_SPEED_SAMPLE_SIZE', () => {
  it('is fixed at 3 — 1-2 measurements are insufficient data', () => {
    expect(MIN_SPEED_SAMPLE_SIZE).toBe(3);
  });
});

describe('selectSpeedBaseline', () => {
  it('picks the first (most specific) candidate with enough samples', () => {
    const result = selectSpeedBaseline([
      baseline('taskNumber', 20000, 5),
      baseline('skill', 25000, 20),
    ]);
    expect(result?.level).toBe('taskNumber');
  });

  it('skips a candidate below MIN_SPEED_SAMPLE_SIZE and falls through', () => {
    const result = selectSpeedBaseline([
      baseline('taskNumber', 20000, 2), // insufficient
      baseline('skill', 25000, 10),
    ]);
    expect(result?.level).toBe('skill');
  });

  it('skips null candidates', () => {
    const result = selectSpeedBaseline([null, baseline('subject', 30000, 15)]);
    expect(result?.level).toBe('subject');
  });

  it('returns null when nothing has enough samples', () => {
    const result = selectSpeedBaseline([
      baseline('taskNumber', 20000, 1),
      baseline('skill', 20000, 2),
      null,
    ]);
    expect(result).toBeNull();
  });

  it('returns null for an all-null/empty list', () => {
    expect(selectSpeedBaseline([])).toBeNull();
    expect(selectSpeedBaseline([null, null])).toBeNull();
  });
});

describe('calculateSpeedNeed', () => {
  it('returns null with no baseline', () => {
    expect(calculateSpeedNeed(10000, null)).toBeNull();
  });

  it('returns 0 when exactly at the baseline', () => {
    expect(calculateSpeedNeed(20000, baseline('taskNumber', 20000, 5))).toBe(0);
  });

  it('returns 0 when faster than the baseline', () => {
    expect(calculateSpeedNeed(10000, baseline('taskNumber', 20000, 5))).toBe(0);
  });

  it('scales linearly above the baseline, capped at 100 for ~2x or slower', () => {
    const b = baseline('taskNumber', 20000, 5);
    expect(calculateSpeedNeed(30000, b)).toBe(50); // 1.5x -> 50
    expect(calculateSpeedNeed(40000, b)).toBe(100); // 2x -> 100
    expect(calculateSpeedNeed(80000, b)).toBe(100); // 4x -> capped at 100
  });

  it('same input always produces the same output (pure)', () => {
    const b = baseline('skill', 15000, 8);
    expect(calculateSpeedNeed(22000, b)).toBe(calculateSpeedNeed(22000, b));
  });

  it('guards against a degenerate zero/negative baseline median', () => {
    expect(calculateSpeedNeed(10000, baseline('taskNumber', 0, 5))).toBeNull();
  });
});

describe('calculateSpeedSignal', () => {
  it('returns null value with no timed measurement, even with a good baseline', () => {
    const result = calculateSpeedSignal(null, [baseline('taskNumber', 20000, 10)]);
    expect(result.value).toBeNull();
    expect(result.baselineLevel).toBe('taskNumber');
    expect(result.sampleSize).toBe(10);
  });

  it('returns null value and null baseline info with insufficient data everywhere', () => {
    const result = calculateSpeedSignal(25000, [baseline('taskNumber', 20000, 1), null]);
    expect(result.value).toBeNull();
    expect(result.baselineLevel).toBeNull();
    expect(result.baselineMedianMs).toBeNull();
    expect(result.sampleSize).toBe(0);
  });

  it('falls through taskNumber -> skill -> subject -> global in order', () => {
    const result = calculateSpeedSignal(10000, [
      null, // taskNumber
      null, // skill
      baseline('subject', 20000, 12), // subject
      baseline('global', 5000, 50), // global
    ]);
    expect(result.baselineLevel).toBe('subject');
  });

  it('computes a real speed value once a usable baseline is found', () => {
    const result = calculateSpeedSignal(30000, [baseline('taskNumber', 20000, 5)]);
    expect(result.value).toBe(50);
    expect(result.baselineMedianMs).toBe(20000);
    expect(result.sampleSize).toBe(5);
  });
});
