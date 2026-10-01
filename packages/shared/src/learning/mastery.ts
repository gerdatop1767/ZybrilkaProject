/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 3 — deterministic skill mastery.
 * No AI/ML anywhere: this is a pure, documented formula over a user's
 * real `attempts` for a skill. Never depends on the DB — callers
 * (`apps/api/src/modules/learning/{repo,service}.ts`) load the attempt
 * history and pass it in, which is what makes this directly unit
 * testable and what makes `updateUserSkillStatistics` and
 * `rebuildUserSkillStatistics` produce identical results: both run the
 * exact same recompute over the exact same attempt history for a
 * skill, never an incremental counter that could drift.
 *
 * mastery (0..100): "how well does the user currently do this skill?"
 *   recentAccuracy * confidenceFraction * 100
 *   - recentAccuracy = correct / total over just the last
 *     RECENCY_WINDOW_SIZE attempts (by time), not the whole history —
 *     so a skill that was 10/10 a month ago and is 1/5 today is NOT
 *     still reported as mastered. A plain all-time average can't do
 *     this: it dilutes recent failures across an ever-growing
 *     denominator instead of ever truly re-weighting toward "now".
 *   - confidenceFraction factors mastery down while data is thin, so
 *     a single lucky correct answer can't read as full mastery (see
 *     confidence below) — this is the direct fix for "1 из 1 не должен
 *     давать 100".
 *
 * confidence (0..100): "how much do we trust that mastery number?" —
 *   a separate question from mastery itself. min(1, attempts /
 *   CONFIDENCE_FULL_THRESHOLD) * 100: 0 attempts -> 0, 1 attempt -> 10,
 *   5 attempts -> 50, 10+ attempts -> 100. Always the TOTAL attempt
 *   count, not just the recency window — more history earns more
 *   trust even once the window itself is full.
 *
 * Both values share the same 0..100 scale everywhere (DB columns, this
 * function, the API response) — never mixed with a 0..1 fraction.
 */

const CONFIDENCE_FULL_THRESHOLD = 10;
const RECENCY_WINDOW_SIZE = 10;

export interface SkillAttemptRecord {
  readonly isCorrect: boolean;
  readonly createdAt: Date;
}

export interface SkillMasteryResult {
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly incorrectAttempts: number;
  /** 0..100. */
  readonly mastery: number;
  /** 0..100. */
  readonly confidence: number;
  readonly lastAttemptAt: Date | null;
}

/**
 * `attemptRecords` is every attempt on every task linked to one skill,
 * for one user, in any order — this function sorts by `createdAt`
 * itself, so callers never need to pre-sort.
 */
export function calculateSkillMastery(
  attemptRecords: readonly SkillAttemptRecord[],
): SkillMasteryResult {
  const attempts = attemptRecords.length;

  if (attempts === 0) {
    return {
      attempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      mastery: 0,
      confidence: 0,
      lastAttemptAt: null,
    };
  }

  const sorted = [...attemptRecords].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const correctAttempts = sorted.filter((a) => a.isCorrect).length;
  const incorrectAttempts = attempts - correctAttempts;
  const lastAttemptAt = sorted[sorted.length - 1]!.createdAt;

  const recentWindow = sorted.slice(-RECENCY_WINDOW_SIZE);
  const recentCorrect = recentWindow.filter((a) => a.isCorrect).length;
  const recentAccuracy = recentCorrect / recentWindow.length;

  const confidenceFraction = Math.min(1, attempts / CONFIDENCE_FULL_THRESHOLD);
  const confidence = Math.round(confidenceFraction * 100);
  const mastery = Math.round(recentAccuracy * confidenceFraction * 100);

  return { attempts, correctAttempts, incorrectAttempts, mastery, confidence, lastAttemptAt };
}
