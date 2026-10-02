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

/** Present only on a VARIANT session (Training's "Вариант" mode) —
 * absent for every Smart Training session. Lets the generic
 * `LearningSession` completion/active screen show "Вариант N" instead
 * of the Smart Training heading, without a second completion system. */
export interface LearningSessionVariantInfo {
  readonly variantId: string;
  readonly variantNumber: number;
  readonly variantTitle: string;
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
  /** Present for `start`/`next` on a Smart Training session (a fresh
   * scoring just ran). Absent for a plain `GET .../:id` snapshot read,
   * AND absent for every variant-session step (its task order is the
   * real exam's own, never scored) — never fabricating or re-deriving
   * a stale one. */
  readonly recommendation?: LearningSessionRecommendationInfo;
  readonly variant?: LearningSessionVariantInfo;
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
  readonly variant?: LearningSessionVariantInfo;
}

/** `null` means no session could be started (no resolvable subject, or
 * the resolved subject has no published tasks at all) — same cold-start
 * honesty as Phase 7/8. */
export type LearningSessionResponse =
  LearningSessionActiveResponse | LearningSessionCompletedResponse | null;

/**
 * Statistics' "Статистика вариантов" — every variant session this user
 * has ever started (ANY status — an abandoned/still-active one shows
 * its real partial progress too, never hidden and never faked as
 * finished; see `getVariantProgress`), newest first.
 */
export interface VariantProgressItem {
  readonly sessionId: string;
  readonly variantId: string;
  readonly variantNumber: number;
  readonly variantTitle: string;
  readonly subjectId: string;
  readonly status: LearningSessionStatus;
  readonly startedAt: string;
  readonly completedAt: string | null;
  /** The variant's real total task count — fixed for the session's lifetime. */
  readonly plannedCount: number;
  /** Distinct consumed tasks with at least one real attempt — same
   * "unique solved, not raw attempts" convention as every other real
   * progress figure in the app. */
  readonly solvedCount: number;
  readonly correctCount: number;
  readonly incorrectCount: number;
  /** 0..100, or `null` when `solvedCount` is 0. */
  readonly accuracyPercent: number | null;
  /** Sum of `timeSpentMs` across timed attempts only — `null` when none
   * of this session's attempts recorded a time. */
  readonly totalTimeMs: number | null;
  /** The same deterministic error-signature codes `GET /me/learning/errors`
   * and the task-number detail view use — never an invented error type. */
  readonly keyErrors: readonly { signature: string; count: number }[];
}

export interface VariantProgressResponse {
  readonly items: readonly VariantProgressItem[];
}
