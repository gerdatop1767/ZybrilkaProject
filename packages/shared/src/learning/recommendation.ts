/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 7 — deterministic, rule-based
 * next-task recommendation. No AI/ML anywhere: every signal below is a
 * plain, documented formula over real data already produced by
 * Phases 1-6 (learning profile, skill mastery, task/skill links, task
 * difficulty, error statistics, task similarity). Same input always
 * produces the same score — no randomness, no hidden state.
 *
 * Like Phase 6's `calculateTaskSimilarity`, this is pure and
 * DB-independent: callers (`apps/api/.../recommendation/{repo,service}.ts`)
 * load every input from the database and pass it in here, which is
 * what makes the formula directly unit testable.
 *
 * SIGNALS (weights sum to 100, chosen so skill weakness dominates —
 * the product's stated core loop is "find and fix weak areas" — while
 * every other signal nudges the choice without overriding it):
 *
 * - skillNeed (35): average `100 - mastery` over the task's linked
 *   skills. An unpracticed skill has mastery 0 (Phase 3's cold-start
 *   convention), so it reads as maximum need — honest, not a bug: a
 *   skill the user has never touched genuinely needs practice.
 *   Omitted (not scored 0) when the task has no linked skills.
 *
 * - errorRelevance (15): what share of the user's own recorded error
 *   signatures (Phase 5) are relevant to this task's `answerType`.
 *   `format_error` only applies to `interval` tasks, `partially_correct`/
 *   `part_incorrect` only to `multi_part`; `blank_answer`/
 *   `incorrect_answer` apply to every type. Omitted when the user has
 *   zero recorded errors (nothing to be relevant to yet).
 *
 * - difficultyFit (15): distance between the task's comparable
 *   difficulty (Phase 6's `getComparableDifficulty` — observed,
 *   falling back to authored) and the user's current average mastery
 *   across every skill they've touched in this subject. A user at
 *   mastery 70 is best served by a task whose difficulty is close to
 *   70 (a real stretch, not busywork and not overwhelming). Omitted
 *   when the user has no skill-statistics rows in this subject yet
 *   (no calibration point).
 *
 * - targetRelevance (10): how the user's target-vs-self-reported score
 *   gap should lean task difficulty. A large gap (far from target)
 *   leans toward easier tasks (build the foundation first); a small
 *   gap leans toward harder tasks (polish toward the target). Omitted
 *   whenever either score is `'unknown'` — never substituted with a
 *   guessed gap.
 *
 * - recency (10): how overdue the task's skills are for review — the
 *   longest idle time (in days) since the user last attempted any of
 *   the task's linked skills, ramped to 100 at `RECENCY_FULL_DAYS`.
 *   Omitted when none of the task's skills have ever been attempted
 *   (that case is already captured honestly by `skillNeed`, not by a
 *   fabricated "infinite" recency).
 *
 * - examImportance (10): what share of the subject's published tasks
 *   use at least one of this task's skills — a real, countable proxy
 *   for "how often does this come up on the actual exam", not an
 *   invented weighting. Omitted when the task has no linked skills.
 *
 * - similarityBonus (5): the task's highest Phase 6 similarity score
 *   against any task the user currently has an OPEN mistake on, in the
 *   same subject — reinforces a weak spot via a related-but-different
 *   task. Omitted when the user has no open mistakes in the subject.
 *
 * Any omitted signal is dropped from the weighted average entirely and
 * the remaining weights are renormalized — exactly Phase 6's "omit,
 * never fake" rule. A candidate where every signal is available gets a
 * score out of the full 100; a candidate with, say, only skillNeed and
 * difficultyFit available still gets an honest 0..100 score computed
 * from just those two, weighted 35:15.
 */

export const RECOMMENDATION_WEIGHTS = {
  skillNeed: 35,
  errorRelevance: 15,
  difficultyFit: 15,
  targetRelevance: 10,
  recency: 10,
  examImportance: 10,
  similarityBonus: 5,
} as const;

export type RecommendationSignal = keyof typeof RECOMMENDATION_WEIGHTS;

const RECENCY_FULL_DAYS = 14;

export type RelevantErrorAnswerType =
  'short_answer' | 'multiple_choice' | 'interval' | 'multi_part';

/** Which error-signature *types* (Phase 5's `ErrorSignatureType`) are
 * honestly relevant to a given task's `answerType`. `incorrect_answer`
 * and `blank_answer` can happen on anything; the other two are
 * structurally only possible on one answer type. */
function isErrorSignatureRelevant(
  errorSignature: string,
  answerType: RelevantErrorAnswerType,
): boolean {
  const type = errorSignature.split(':')[0];
  if (type === 'incorrect_answer' || type === 'blank_answer') return true;
  if (type === 'format_error') return answerType === 'interval';
  if (type === 'partially_correct' || type === 'part_incorrect') return answerType === 'multi_part';
  return false;
}

export interface UserErrorStatisticCount {
  readonly errorSignature: string;
  readonly count: number;
}

/** 0..100, or `null` if the user has zero recorded errors (signal
 * unavailable, never substituted with 0). */
export function calculateErrorRelevance(
  errorStatistics: readonly UserErrorStatisticCount[],
  answerType: RelevantErrorAnswerType,
): number | null {
  const total = errorStatistics.reduce((sum, e) => sum + e.count, 0);
  if (total === 0) return null;
  const relevant = errorStatistics
    .filter((e) => isErrorSignatureRelevant(e.errorSignature, answerType))
    .reduce((sum, e) => sum + e.count, 0);
  return Math.round((relevant / total) * 100);
}

/** 0..100, or `null` when the task has no linked skills. Skills with
 * no `user_skill_statistics` row yet are treated as mastery 0 — same
 * cold-start convention as Phase 3. */
export function calculateSkillNeed(skillMasteries: readonly number[]): number | null {
  if (skillMasteries.length === 0) return null;
  const avgMastery = skillMasteries.reduce((sum, m) => sum + m, 0) / skillMasteries.length;
  return Math.round(100 - avgMastery);
}

/** 0..100, or `null` when the user has no skill-statistics in this
 * subject yet (no calibration point for "current ability"). */
export function calculateDifficultyFit(
  taskComparableDifficulty: number,
  userSubjectAverageMastery: number | null,
): number | null {
  if (userSubjectAverageMastery === null) return null;
  return Math.round(100 - Math.abs(taskComparableDifficulty - userSubjectAverageMastery));
}

/** Maps a self-reported/target score band to its numeric midpoint —
 * an explicit, documented approximation of a categorical band, never
 * presented as a precise measurement. `'unknown'` has no midpoint. */
export const SELF_REPORTED_SCORE_MIDPOINTS: Record<string, number | null> = {
  unknown: null,
  under_40: 30,
  '40_plus': 45,
  '50_plus': 55,
  '60_plus': 65,
  '70_plus': 75,
  '80_plus': 85,
  '90_plus': 95,
};

export const TARGET_SCORE_MIDPOINTS: Record<string, number | null> = {
  unknown: null,
  '60_plus': 65,
  '70_plus': 75,
  '80_plus': 85,
  '90_plus': 95,
  '95_plus': 97,
  '100': 100,
};

/** 0..100, or `null` when either score is `'unknown'`. */
export function calculateTargetGap(selfReportedScore: string, targetScore: string): number | null {
  const self = SELF_REPORTED_SCORE_MIDPOINTS[selfReportedScore] ?? null;
  const target = TARGET_SCORE_MIDPOINTS[targetScore] ?? null;
  if (self === null || target === null) return null;
  return Math.max(0, Math.min(100, target - self));
}

/** 0..100, or `null` when `gap` is `null` (score unknown). A large gap
 * leans the target difficulty down (foundation first); a small gap
 * leans it up (polish toward the target). */
export function calculateTargetRelevance(
  gap: number | null,
  taskComparableDifficulty: number,
): number | null {
  if (gap === null) return null;
  const leanTowardHarder = 100 - gap;
  return Math.round(100 - Math.abs(taskComparableDifficulty - leanTowardHarder));
}

/** 0..100, or `null` when none of the task's skills have ever been
 * attempted. `daysSinceEachSkillLastAttempted` holds one entry per
 * linked skill that DOES have attempt history (skills with none are
 * left out by the caller, not passed as `null`/`Infinity`). */
export function calculateRecency(
  daysSinceEachSkillLastAttempted: readonly number[],
): number | null {
  if (daysSinceEachSkillLastAttempted.length === 0) return null;
  const mostOverdueDays = Math.max(...daysSinceEachSkillLastAttempted);
  return Math.round(Math.min(100, (mostOverdueDays / RECENCY_FULL_DAYS) * 100));
}

/** 0..100, or `null` when the task has no linked skills. Each ratio is
 * "published tasks in the subject containing this skill / total
 * published tasks in the subject". */
export function calculateExamImportance(skillFrequencyRatios: readonly number[]): number | null {
  if (skillFrequencyRatios.length === 0) return null;
  const avg = skillFrequencyRatios.reduce((sum, r) => sum + r, 0) / skillFrequencyRatios.length;
  return Math.round(avg * 100);
}

/** 0..100, or `null` when the user has no open mistakes in the subject
 * (nothing to be similar to yet). `similarityScores` is the Phase 6
 * `calculateTaskSimilarity` score against each open-mistake task. */
export function calculateSimilarityBonus(similarityScores: readonly number[]): number | null {
  if (similarityScores.length === 0) return null;
  return Math.max(...similarityScores);
}

export interface RecommendationSignalScores {
  readonly skillNeed: number | null;
  readonly errorRelevance: number | null;
  readonly difficultyFit: number | null;
  readonly targetRelevance: number | null;
  readonly recency: number | null;
  readonly examImportance: number | null;
  readonly similarityBonus: number | null;
}

export interface RecommendationSignalBreakdownEntry {
  /** 0..100, or `null` if this signal was unavailable for this candidate. */
  readonly score: number | null;
  readonly weight: number;
  readonly included: boolean;
}

export type RecommendationBreakdown = Record<
  RecommendationSignal,
  RecommendationSignalBreakdownEntry
>;

export interface TaskRecommendationScore {
  /** 0..100 — weighted average of every AVAILABLE signal, renormalized
   * over just those signals' weights (never padded with a fake 0 for
   * a missing one). 0 only if no signals were available at all (a
   * task with no skills, no history, no errors, no mistakes to relate
   * to — an honest "we know nothing" floor, not a penalty). */
  readonly total: number;
  readonly breakdown: RecommendationBreakdown;
}

/** Combines every precomputed signal score into one explainable total.
 * Pure arithmetic — no DB access, no randomness. */
export function combineRecommendationSignals(
  signals: RecommendationSignalScores,
): TaskRecommendationScore {
  const breakdown = {} as RecommendationBreakdown;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const key of Object.keys(RECOMMENDATION_WEIGHTS) as RecommendationSignal[]) {
    const score = signals[key];
    const weight = RECOMMENDATION_WEIGHTS[key];
    const included = score !== null;
    breakdown[key] = { score, weight, included };
    if (included) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  const total = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { total, breakdown };
}
