/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 8 — deterministic learning
 * path / next-step sequence. No AI/ML, no randomness: builds on
 * Phase 7's `recommendation.ts` signals (reused unchanged) plus three
 * small, explicit, pure SEQUENCE-SPECIFIC adjustments that account for
 * the fact that picking task N changes what the best task N+1 is:
 *
 * - `calculateSkillCoverageNeed` — a generalization of Phase 7's
 *   `calculateSkillNeed` that also knows how many times each of the
 *   task's skills has already been covered by an EARLIER step in THIS
 *   sequence. With zero prior coverage it is mathematically identical
 *   to `calculateSkillNeed` (so step 1 of a path behaves like a single
 *   Phase 7 pick) — see `SKILL_COVERAGE_PENALTY_PER_REPEAT` below for
 *   how repeats are discouraged without being banned outright.
 *
 * - `resolveStepIdealDifficulty` — what task difficulty the sequence
 *   is aiming for at a given position. Step 1 targets the user's plain
 *   subject-average mastery, exactly like Phase 7's `difficultyFit`.
 *   From step 2 on, it nudges the target up from the PREVIOUS step's
 *   own difficulty (a real easy→medium→harder progression becomes
 *   possible), but only as far as the user's measured mastery actually
 *   supports — see `DIFFICULTY_PROGRESSION_STEP`/`_MASTERY_MARGIN`.
 *
 * - `compareLearningPathCandidates` — the one total order used to pick
 *   every step: score desc, then taskNumber asc, then taskId asc. The
 *   exact same tie-break Phase 6/7 already use, extracted here as its
 *   own pure, independently testable function since Phase 8 applies it
 *   at every position of a multi-step selection loop.
 *
 * Everything else a step's score needs (errorRelevance, targetRelevance,
 * recency, examImportance, similarityBonus) reuses Phase 7's existing
 * functions completely unchanged — Phase 8 does not redefine them.
 * `similarityBonus` is still Phase 7's own `calculateSimilarityBonus`;
 * Phase 8 only widens WHAT it's compared against (the caller passes a
 * reference pool that can include the user's open mistakes, recently
 * solved tasks, and previously selected steps — see
 * `apps/api/.../learningPath/service.ts`), never changes the formula.
 */

/**
 * Each prior appearance of a skill within the SAME sequence lowers its
 * priority by this many points — but never zeroes it out outright, so
 * a skill with genuinely high remaining need (e.g. truly unpracticed,
 * need=100) can still resurface a second time if nothing else in the
 * candidate pool covers a different weak skill better. This is the
 * concrete mechanism for "avoid duplicate skills without an arbitrary
 * one-task-per-skill rule": 1 prior coverage costs 40 points, 2 prior
 * coverages cost 80 — by the 3rd repeat, only an otherwise-untouched
 * skill (need=100) could still outscore an uncovered skill at all, and
 * even then only barely (100-120 clamps to 0).
 */
const SKILL_COVERAGE_PENALTY_PER_REPEAT = 40;

/** 0..100, or `null` when the task has no linked skills (same guard as
 * Phase 7's `calculateSkillNeed`). `masteryBySkillId` defaults an
 * absent skill to mastery 0 — Phase 3's cold-start convention, same as
 * Phase 7. `coverageCountBySkillId` is how many EARLIER steps in this
 * same sequence already included each skill — absent means 0 (never
 * covered yet). With every count at 0 this returns exactly what
 * `calculateSkillNeed` would for the same skills. */
export function calculateSkillCoverageNeed(
  skillIds: readonly string[],
  masteryBySkillId: ReadonlyMap<string, number>,
  coverageCountBySkillId: ReadonlyMap<string, number>,
): number | null {
  if (skillIds.length === 0) return null;
  const perSkillNeed = skillIds.map((id) => {
    const mastery = masteryBySkillId.get(id) ?? 0;
    const need = 100 - mastery;
    const timesCovered = coverageCountBySkillId.get(id) ?? 0;
    return Math.max(0, need - timesCovered * SKILL_COVERAGE_PENALTY_PER_REPEAT);
  });
  const avg = perSkillNeed.reduce((sum, v) => sum + v, 0) / perSkillNeed.length;
  return Math.round(avg);
}

/** How far above the previous step's difficulty the sequence is
 * willing to reach for the next step, when mastery supports it. */
const DIFFICULTY_PROGRESSION_STEP = 15;

/** The progression target is never allowed to exceed the user's
 * measured subject-average mastery by more than this margin — the
 * concrete mechanism for "avoid jumping to unnecessarily difficult
 * tasks unless measured mastery supports it": a user whose real
 * mastery is 40 cannot be walked up to a difficulty-90 task over a
 * few steps just because each individual +15 step looked small. */
const DIFFICULTY_PROGRESSION_MASTERY_MARGIN = 10;

/** The task-difficulty value a step's `difficultyFit` (Phase 7's
 * unchanged `calculateDifficultyFit`) should be measured against.
 * `null` with no subject calibration (same cold-start omission as
 * Phase 7). Step 1 (`previousStepDifficulty === null`) targets plain
 * subject-average mastery — byte-identical to Phase 7's own
 * `difficultyFit` input. From step 2 on, the target is nudged up from
 * the previous step's OWN difficulty, clamped so it never outruns what
 * mastery actually supports. This never forces a fixed ladder: if
 * `DIFFICULTY_PROGRESSION_STEP` would overshoot the mastery-based
 * ceiling, the target simply stays at the ceiling (no escalation),
 * and if the previous step was already harder than the ceiling, the
 * target can even step back down toward it. */
export function resolveStepIdealDifficulty(
  userSubjectAverageMastery: number | null,
  previousStepDifficulty: number | null,
): number | null {
  if (userSubjectAverageMastery === null) return null;
  if (previousStepDifficulty === null) return userSubjectAverageMastery;

  const proposed = previousStepDifficulty + DIFFICULTY_PROGRESSION_STEP;
  const ceiling = userSubjectAverageMastery + DIFFICULTY_PROGRESSION_MASTERY_MARGIN;
  return Math.max(0, Math.min(100, Math.min(proposed, ceiling)));
}

export interface LearningPathCandidateOrdering {
  readonly total: number;
  readonly taskNumber: number;
  readonly taskId: string;
}

/**
 * The one total order used to pick every step of a path (and Phase 7's
 * single pick): score desc, then taskNumber asc, then taskId asc.
 * `taskId` is unique, so this always yields a strict total order —
 * the same DB state always produces the same winner at every position,
 * regardless of the order candidates were read from the database in.
 */
export function compareLearningPathCandidates(
  a: LearningPathCandidateOrdering,
  b: LearningPathCandidateOrdering,
): number {
  return b.total - a.total || a.taskNumber - b.taskNumber || a.taskId.localeCompare(b.taskId);
}
