/**
 * ZUBRILKA LEARNING INTELLIGENCE — Speed Learning signal (Statistics
 * 2.0). No AI/ML, no fixed universal thresholds like ">60s = slow":
 * every comparison is against the user's OWN history, picked from the
 * most specific level available (taskNumber > skill > subject >
 * global task-level). Deliberately NOT wired into
 * `combineRecommendationSignals`/mastery/difficulty — purely additive:
 * computed, returned, and tested on its own until enough real data
 * exists to decide how (if at all) to fold it into Learning
 * Intelligence later.
 */

/** Below this many timed samples, a baseline is not trustworthy enough
 * to compare against — 1-2 measurements is noise, not a pattern. */
export const MIN_SPEED_SAMPLE_SIZE = 3;

export type SpeedBaselineLevel = 'taskNumber' | 'skill' | 'subject' | 'global';

export interface SpeedBaselineSource {
  readonly level: SpeedBaselineLevel;
  /** Real median (never mean) of that level's timed attempts — robust
   * to one slow outlier skewing the whole baseline. */
  readonly medianTimeMs: number;
  readonly sampleSize: number;
}

export interface SpeedSignalResult {
  /** 0 = at/faster than personal baseline; 100 = ~2x (or more) the
   * baseline's median. `null` when there's no timed measurement or no
   * baseline with enough samples — never a fabricated 50. */
  readonly value: number | null;
  readonly baselineLevel: SpeedBaselineLevel | null;
  readonly baselineMedianMs: number | null;
  readonly sampleSize: number;
}

/** `times` need not be sorted; empty input returns `null`, never 0. */
export function calculateMedian(times: readonly number[]): number | null {
  if (times.length === 0) return null;
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/**
 * Picks the first candidate, in the given priority order, with at
 * least `MIN_SPEED_SAMPLE_SIZE` samples — never silently falls back to
 * a broader level's larger sample count when a narrower one is simply
 * absent (`null` candidates are skipped, not treated as "0 need").
 */
export function selectSpeedBaseline(
  candidatesInPriorityOrder: readonly (SpeedBaselineSource | null)[],
): SpeedBaselineSource | null {
  for (const candidate of candidatesInPriorityOrder) {
    if (candidate && candidate.sampleSize >= MIN_SPEED_SAMPLE_SIZE) return candidate;
  }
  return null;
}

/**
 * Pure: same `timeSpentMs` + same `baseline` always produces the same
 * number. Linear in how far over the baseline's median the time is,
 * capped at 100; at or under the baseline is always exactly 0 (not a
 * small negative "bonus" — this is a *need* signal, not a score).
 */
export function calculateSpeedNeed(
  timeSpentMs: number,
  baseline: SpeedBaselineSource | null,
): number | null {
  if (baseline === null || baseline.medianTimeMs <= 0) return null;
  const ratio = timeSpentMs / baseline.medianTimeMs;
  if (ratio <= 1) return 0;
  return Math.min(100, Math.round((ratio - 1) * 100));
}

/**
 * Ties `selectSpeedBaseline` + `calculateSpeedNeed` together into the
 * one result shape the API returns — `candidatesInPriorityOrder` must
 * already be ordered taskNumber -> skill -> subject -> global by the
 * caller (this function never reorders or re-prioritizes them).
 */
export function calculateSpeedSignal(
  timeSpentMs: number | null,
  candidatesInPriorityOrder: readonly (SpeedBaselineSource | null)[],
): SpeedSignalResult {
  const baseline = selectSpeedBaseline(candidatesInPriorityOrder);
  const sampleSize = baseline?.sampleSize ?? 0;
  if (timeSpentMs === null || baseline === null) {
    return {
      value: null,
      baselineLevel: baseline?.level ?? null,
      baselineMedianMs: baseline?.medianTimeMs ?? null,
      sampleSize,
    };
  }
  return {
    value: calculateSpeedNeed(timeSpentMs, baseline),
    baselineLevel: baseline.level,
    baselineMedianMs: baseline.medianTimeMs,
    sampleSize,
  };
}
