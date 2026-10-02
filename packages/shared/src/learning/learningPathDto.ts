import type { TaskPublic } from '../tasks.js';
import type { RecommendationBreakdown } from './recommendation.js';

/** One step of a `GET /me/learning/path` sequence. `task` is the same
 * pre-attempt `TaskPublic` shape every other task-listing endpoint
 * already returns (never the answer/explanation — this is a
 * recommendation, not a solved task). `score`/`breakdown`/`reason`
 * are THIS STEP's own values at the position it was selected for —
 * not comparable across different paths or positions, since later
 * steps score remaining candidates under different sequence-specific
 * adjustments (see `packages/shared/src/learning/learningPath.ts`). */
export interface LearningPathStep {
  /** 1-based position in the sequence. */
  readonly position: number;
  readonly task: TaskPublic;
  /** 0..100 — see `combineRecommendationSignals`. */
  readonly score: number;
  readonly reason: string;
  readonly breakdown: RecommendationBreakdown;
}

/** `GET /me/learning/path` response. `null` means no path could be
 * built (no onboarded subject, or the resolved subject has no
 * published tasks) — same cold-start honesty as Phase 7's
 * `NextTaskRecommendationResponse`. */
export interface LearningPathResponse {
  readonly subject: string;
  readonly steps: readonly LearningPathStep[];
}

export type LearningPathResponseOrNull = LearningPathResponse | null;
