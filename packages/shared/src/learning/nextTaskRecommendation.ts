import type { RecommendationBreakdown } from './recommendation.js';

/** `GET /me/learning/next-task` response — one recommended task with a
 * fully explainable score breakdown (ZUBRILKA LEARNING INTELLIGENCE
 * Phase 7). `null` means no recommendation could be made (no onboarded
 * subject, or no published tasks exist in the resolved subject). */
export interface NextTaskRecommendation {
  readonly taskId: string;
  readonly taskNumber: number;
  readonly subjectId: string;
  /** 0..100 — see `combineRecommendationSignals`. */
  readonly score: number;
  readonly breakdown: RecommendationBreakdown;
  /** Short, generated-from-the-breakdown human-readable reason — not a
   * canned string, points at whichever signal(s) actually drove the pick. */
  readonly reason: string;
}

export type NextTaskRecommendationResponse = NextTaskRecommendation | null;
