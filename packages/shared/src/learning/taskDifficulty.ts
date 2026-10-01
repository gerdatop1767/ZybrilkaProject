/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 4 — deterministic, observed
 * task difficulty. No AI/ML: a pure, documented formula over a task's
 * real `attempts`, loaded by the caller
 * (`apps/api/src/modules/learning/taskStatistics/{repo,service}.ts`)
 * and passed in here — never DB-dependent, so both the per-attempt
 * update and `rebuildTaskStatistics` call the exact same function over
 * the exact same attempt history and always converge.
 *
 * This is a SEPARATE statistic from `tasks.difficulty` (the author's
 * fixed 1..3 editorial rating set at import time) — this module never
 * reads or writes that column.
 *
 * difficulty (0..100, null at 0 attempts): "how hard has this task
 * actually been for real users?" Naively using `100 - accuracy`
 * breaks down exactly where the task description warns: 1 wrong out
 * of 1 would read as "maximally difficult", and a brand-new task with
 * zero data would need a fabricated number. Instead this shrinks the
 * raw accuracy-derived difficulty toward a NEUTRAL midpoint (50) while
 * evidence is thin, by the same `confidenceFraction` used for
 * `confidence` itself:
 *
 *   accuracy       = correctAttempts / attempts
 *   difficultyRaw  = (1 - accuracy) * 100
 *   difficulty     = NEUTRAL_BASELINE * (1 - confidenceFraction)
 *                   + difficultyRaw * confidenceFraction
 *
 * Shrinking toward 50 (not 0, unlike `calculateSkillMastery`'s
 * shrink-toward-0) is a deliberate, different choice: "no evidence yet"
 * about a USER's skill is reasonably pessimistic (assume not yet
 * mastered), but "no evidence yet" about a TASK's objective difficulty
 * carries no such assumption — a new task is neither known-easy nor
 * known-hard, so the honest prior is exactly in the middle. With
 * enough evidence (confidenceFraction -> 1), difficulty converges to
 * the plain accuracy-derived value; with none, it sits at the prior.
 *
 * confidence (0..100): "how much evidence backs that number?" —
 *   min(1, attempts / CONFIDENCE_FULL_THRESHOLD) * 100, same shape as
 *   Phase 3's skill confidence. Monotonically non-decreasing in
 *   attempts by construction, and always defined (0 at zero attempts),
 *   even though `difficulty`/`accuracy` are null there.
 *
 * `averageTimeMs` is informational only, never a factor in
 * `difficulty` — simple mean of whatever non-null `timeSpentMs`
 * values exist (nulls are skipped, not treated as 0, and a single
 * outlier can't crash or null out the rest of the statistics since
 * time is computed independently of difficulty/confidence).
 */

const CONFIDENCE_FULL_THRESHOLD = 10;
const NEUTRAL_DIFFICULTY_BASELINE = 50;

export interface TaskAttemptRecord {
  readonly isCorrect: boolean;
  readonly createdAt: Date;
  readonly timeSpentMs?: number | null;
}

export interface TaskDifficultyResult {
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly incorrectAttempts: number;
  /** 0..100, null until the first attempt. */
  readonly accuracy: number | null;
  /** 0..100, null until the first attempt. */
  readonly difficulty: number | null;
  /** 0..100 — always defined, even at 0 attempts. */
  readonly confidence: number;
  readonly averageTimeMs: number | null;
  readonly lastAttemptAt: Date | null;
}

export function calculateTaskDifficulty(
  attemptRecords: readonly TaskAttemptRecord[],
): TaskDifficultyResult {
  const attempts = attemptRecords.length;

  if (attempts === 0) {
    return {
      attempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: null,
      difficulty: null,
      confidence: 0,
      averageTimeMs: null,
      lastAttemptAt: null,
    };
  }

  const sorted = [...attemptRecords].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const correctAttempts = sorted.filter((a) => a.isCorrect).length;
  const incorrectAttempts = attempts - correctAttempts;
  const lastAttemptAt = sorted[sorted.length - 1]!.createdAt;

  const accuracyFraction = correctAttempts / attempts;
  const accuracy = Math.round(accuracyFraction * 100);

  const confidenceFraction = Math.min(1, attempts / CONFIDENCE_FULL_THRESHOLD);
  const confidence = Math.round(confidenceFraction * 100);

  const difficultyRaw = (1 - accuracyFraction) * 100;
  const difficulty = Math.round(
    NEUTRAL_DIFFICULTY_BASELINE * (1 - confidenceFraction) + difficultyRaw * confidenceFraction,
  );

  const timeValues = sorted
    .map((a) => a.timeSpentMs)
    .filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t >= 0);
  const averageTimeMs =
    timeValues.length > 0
      ? Math.round(timeValues.reduce((sum, v) => sum + v, 0) / timeValues.length)
      : null;

  return {
    attempts,
    correctAttempts,
    incorrectAttempts,
    accuracy,
    difficulty,
    confidence,
    averageTimeMs,
    lastAttemptAt,
  };
}
