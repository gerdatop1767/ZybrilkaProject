import type { TaskPublic } from '../tasks.js';
import type { RecommendationBreakdown } from './recommendation.js';

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 9 — session lifecycle DTOs.
 * A session is pure bookkeeping (which tasks it already served) over
 * the existing deterministic Phase 7/8 engines and the existing
 * attempt-submission flow — never a second source of truth for
 * attempts, mastery, errors, or task statistics (see
 * `apps/api/.../learningSession/service.ts`).
 */
export const learningSessionStatuses = ['active', 'completed'] as const;
export type LearningSessionStatus = (typeof learningSessionStatuses)[number];

export interface LearningSessionRecommendationInfo {
  /** 0..100 — see `combineRecommendationSignals`. Freshly computed for
   * THIS step against the CURRENT database state, never cached from an
   * earlier step. */
  readonly score: number;
  readonly reason: string;
  readonly breakdown: RecommendationBreakdown;
}

/** `POST /me/learning/sessions`, `GET /me/learning/sessions/:id/next`,
 * and `GET /me/learning/sessions/:id` response while the session still
 * has steps left to serve. */
export interface LearningSessionActiveResponse {
  readonly sessionId: string;
  readonly subject: string;
  readonly status: 'active';
  /** 1-based — how many tasks this session has served so far, including `task`. */
  readonly position: number;
  /** The originally requested session length — fixed for the session's lifetime. */
  readonly total: number;
  readonly task: TaskPublic;
  /** Present for `start`/`next` (a fresh scoring just ran). Absent for
   * a plain `GET .../:id` snapshot read (e.g. page-refresh recovery) —
   * that call never re-runs scoring, so it honestly has no breakdown
   * to show rather than fabricating or re-deriving a stale one. */
  readonly recommendation?: LearningSessionRecommendationInfo;
}

/**
 * Derived ENTIRELY from real `attempts`/`mistakes`/`task_skills` rows
 * created during this session's time window — never a second,
 * invented statistic. See `computeSessionSummary` for the exact
 * queries each field comes from.
 */
export interface LearningSessionSummary {
  /** Distinct consumed tasks with at least one real attempt during the session. */
  readonly attempted: number;
  /** Of those, how many were eventually answered correctly (any attempt isCorrect). */
  readonly correct: number;
  /** Attempted but never answered correctly during the session. */
  readonly incorrect: number;
  /** 0..100, or `null` when `attempted` is 0 — never a fabricated 0. */
  readonly accuracy: number | null;
  /** Distinct real `task_skills` skill ids across the ATTEMPTED consumed tasks. */
  readonly skillsPracticed: number;
  /** Real `mistakes` rows whose `createdAt` falls within this session's window. */
  readonly mistakesCreated: number;
}

/** Response once the session has reached its requested length or run
 * out of valid candidates — same shape either way, since both are a
 * legitimate, honest end state (see Phase 9's "no-candidate completion" rule). */
export interface LearningSessionCompletedResponse {
  readonly sessionId: string;
  readonly subject: string;
  readonly status: 'completed';
  readonly position: number;
  readonly total: number;
  readonly summary: LearningSessionSummary;
}

/** `null` means no session could be started (no resolvable subject, or
 * the resolved subject has no published tasks at all) — same cold-start
 * honesty as Phase 7/8. */
export type LearningSessionResponse =
  LearningSessionActiveResponse | LearningSessionCompletedResponse | null;
