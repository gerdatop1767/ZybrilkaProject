import type { Database } from '@zybrilka/db';
import type { LearningSessionResponse, LearningSessionSummary } from '@zybrilka/shared';
import { getLearningPath } from '../learningPath/service.js';
import { resolveSubjectId } from '../recommendation/service.js';
import * as tasksRepo from '../../tasks/repo.js';
import { toPublicTask } from '../../tasks/service.js';
import * as repo from './repo.js';

export interface StartLearningSessionContext {
  readonly subjectId?: string;
  /** Already validated at the route layer (1..10). */
  readonly total: number;
}

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 9 — the learning-session
 * engine. A session is pure bookkeeping over the EXISTING deterministic
 * stack: it never computes its own score, never caches a
 * recommendation across steps, and never writes to `attempts`,
 * `mistakes`, `user_skill_statistics`, `task_statistics`, or
 * `user_error_statistics` — the real attempt-submission transaction
 * (`modules/tasks/service.ts#submitAttempt`) remains the ONLY writer
 * of learning state. Every step (start and `next` alike) asks Phase 8's
 * `getLearningPath` for exactly ONE fresh-scored task
 * (`limit: 1`), excluding whatever this session has already served —
 * so if the user just got something wrong (or right), the very next
 * call sees the already-updated mastery/error/difficulty numbers,
 * because it re-reads them from scratch every time.
 */
export async function startLearningSession(
  db: Database,
  userId: string,
  context: StartLearningSessionContext,
): Promise<LearningSessionResponse> {
  const subjectId = await resolveSubjectId(db, userId, { subjectId: context.subjectId });
  if (!subjectId) return null;

  const path = await getLearningPath(db, userId, { subjectId, limit: 1 });
  if (!path || path.steps.length === 0) return null;

  const firstStep = path.steps[0]!;
  const session = await repo.createSession(db, {
    userId,
    subjectId,
    total: context.total,
    firstTaskId: firstStep.task.id,
  });

  return {
    sessionId: session.id,
    subject: subjectId,
    status: 'active',
    position: 1,
    total: session.total,
    task: firstStep.task,
    recommendation: {
      score: firstStep.score,
      reason: firstStep.reason,
      breakdown: firstStep.breakdown,
    },
  };
}

/** `null` means "no such session, or it does not belong to this user"
 * — both map to the same outer 404, never distinguishing between them,
 * so a session id can't be used to probe whether it exists for someone
 * else (same privacy posture as every other `/me/*` endpoint). */
export async function advanceLearningSession(
  db: Database,
  userId: string,
  sessionId: string,
): Promise<LearningSessionResponse> {
  const session = await repo.getSessionById(db, sessionId);
  if (!session || session.userId !== userId) return null;

  if (session.status === 'completed') {
    // Idempotent: asking for "next" again on a finished session just
    // re-returns its summary, never an error.
    return buildCompletedResponse(db, session);
  }

  if (session.consumedTaskIds.length >= session.total) {
    const completed = await repo.markCompleted(db, session.id);
    return buildCompletedResponse(db, completed);
  }

  const path = await getLearningPath(db, userId, {
    subjectId: session.subjectId,
    limit: 1,
    excludeTaskIds: session.consumedTaskIds,
  });

  if (!path || path.steps.length === 0) {
    // No valid candidate remains in the subject — an honest early
    // completion, not an error (Phase 9's "no-candidate completion" rule).
    const completed = await repo.markCompleted(db, session.id);
    return buildCompletedResponse(db, completed);
  }

  const step = path.steps[0]!;
  const updated = await repo.appendConsumedTask(db, session.id, step.task.id);

  return {
    sessionId: updated.id,
    subject: updated.subjectId,
    status: 'active',
    position: updated.consumedTaskIds.length,
    total: updated.total,
    task: step.task,
    recommendation: { score: step.score, reason: step.reason, breakdown: step.breakdown },
  };
}

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 10 — read-only session
 * recovery (page refresh / direct link to `/learning/session/:id`).
 * Unlike `advanceLearningSession`, this NEVER consumes a new task slot
 * and NEVER re-runs scoring — it just reports the CURRENT state: the
 * last task this session already served (or, once completed, the same
 * real summary `advanceLearningSession` would return). This is the
 * smallest safe backend addition for frontend refresh-safety: without
 * it, a page reload on an active session would have no way to recover
 * "which task was I on" without either inventing client-only state
 * (which could desync from the server) or wrongly calling `/next`
 * (which WOULD consume another task slot just because the user
 * reloaded, violating Phase 9's "next only after a real submission"
 * rule). `recommendation` is intentionally omitted here (see the DTO) —
 * recovering it would require re-scoring, which this endpoint must
 * never do.
 */
export async function getLearningSessionSnapshot(
  db: Database,
  userId: string,
  sessionId: string,
): Promise<LearningSessionResponse> {
  const session = await repo.getSessionById(db, sessionId);
  if (!session || session.userId !== userId) return null;

  if (session.status === 'completed') {
    return buildCompletedResponse(db, session);
  }

  const currentTaskId = session.consumedTaskIds[session.consumedTaskIds.length - 1];
  if (!currentTaskId) return null;

  const row = await tasksRepo.getTaskById(db, currentTaskId);
  if (!row) return null;

  return {
    sessionId: session.id,
    subject: session.subjectId,
    status: 'active',
    position: session.consumedTaskIds.length,
    total: session.total,
    task: toPublicTask(row),
  };
}

async function buildCompletedResponse(
  db: Database,
  session: repo.LearningSessionRow,
): Promise<LearningSessionResponse> {
  const summary = await computeSessionSummary(db, session);
  return {
    sessionId: session.id,
    subject: session.subjectId,
    status: 'completed',
    position: session.consumedTaskIds.length,
    total: session.total,
    summary,
  };
}

/** Every field here is computed directly from real `attempts`/
 * `mistakes`/`task_skills` rows — see `repo.ts`'s queries. No metric
 * that can't be honestly attributed to this session's own task set and
 * time window is included (per Phase 9's "do not invent metrics" rule). */
async function computeSessionSummary(
  db: Database,
  session: repo.LearningSessionRow,
): Promise<LearningSessionSummary> {
  const taskIds = session.consumedTaskIds;
  if (taskIds.length === 0) {
    return {
      attempted: 0,
      correct: 0,
      incorrect: 0,
      accuracy: null,
      skillsPracticed: 0,
      mistakesCreated: 0,
    };
  }

  const [sessionAttempts, mistakesCreated] = await Promise.all([
    repo.getSessionAttempts(db, session.userId, taskIds, session.startedAt),
    repo.countMistakesCreatedSince(db, session.userId, taskIds, session.startedAt),
  ]);

  const attemptedTaskIds = new Set(sessionAttempts.map((a) => a.taskId));
  const correctTaskIds = new Set(sessionAttempts.filter((a) => a.isCorrect).map((a) => a.taskId));
  const incorrectTaskIds = [...attemptedTaskIds].filter((id) => !correctTaskIds.has(id));

  const attempted = attemptedTaskIds.size;
  const correct = correctTaskIds.size;
  const incorrect = incorrectTaskIds.length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

  const skillIds = await repo.getSkillIdsForTasks(db, [...attemptedTaskIds]);
  const skillsPracticed = new Set(skillIds).size;

  return { attempted, correct, incorrect, accuracy, skillsPracticed, mistakesCreated };
}
