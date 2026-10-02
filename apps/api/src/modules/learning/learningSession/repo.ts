import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import type { LearningSessionStatus } from '@zybrilka/shared';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';

export interface LearningSessionRow {
  readonly id: string;
  readonly userId: string;
  readonly subjectId: string;
  readonly total: number;
  readonly consumedTaskIds: readonly string[];
  readonly status: LearningSessionStatus;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
}

function toRow(row: typeof schema.learningSessions.$inferSelect): LearningSessionRow {
  return {
    id: row.id,
    userId: row.userId,
    subjectId: row.subjectId,
    total: row.total,
    consumedTaskIds: row.consumedTaskIds,
    status: row.status as LearningSessionStatus,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

/** The first task is included at creation time (never a separate
 * insert-then-append) so a session is never observably in a state
 * with zero consumed tasks. */
export async function createSession(
  db: Database,
  input: { userId: string; subjectId: string; total: number; firstTaskId: string },
): Promise<LearningSessionRow> {
  const [row] = await db
    .insert(schema.learningSessions)
    .values({
      userId: input.userId,
      subjectId: input.subjectId,
      total: input.total,
      consumedTaskIds: [input.firstTaskId],
    })
    .returning();
  return toRow(row!);
}

export async function getSessionById(
  db: Database,
  sessionId: string,
): Promise<LearningSessionRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.learningSessions)
    .where(eq(schema.learningSessions.id, sessionId));
  return row ? toRow(row) : undefined;
}

/** Atomic append via the jsonb `||` concat operator — never a
 * read-modify-write race between concurrent requests for the same
 * session. Returns the row AFTER the append. */
export async function appendConsumedTask(
  db: Database,
  sessionId: string,
  taskId: string,
): Promise<LearningSessionRow> {
  const [row] = await db
    .update(schema.learningSessions)
    .set({
      consumedTaskIds: sql`${schema.learningSessions.consumedTaskIds} || ${JSON.stringify([taskId])}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(schema.learningSessions.id, sessionId))
    .returning();
  return toRow(row!);
}

export async function markCompleted(db: Database, sessionId: string): Promise<LearningSessionRow> {
  const [row] = await db
    .update(schema.learningSessions)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.learningSessions.id, sessionId))
    .returning();
  return toRow(row!);
}

export interface SessionAttemptRow {
  readonly taskId: string;
  readonly isCorrect: boolean;
}

/** Every attempt by this user, on one of `taskIds`, created at or
 * after `since` — the real evidence the session summary is built from.
 * `since` (the session's own `startedAt`) excludes any older attempt
 * on the same task from before the session existed. */
export async function getSessionAttempts(
  db: Database,
  userId: string,
  taskIds: readonly string[],
  since: Date,
): Promise<SessionAttemptRow[]> {
  if (taskIds.length === 0) return [];
  return db
    .select({ taskId: schema.attempts.taskId, isCorrect: schema.attempts.isCorrect })
    .from(schema.attempts)
    .where(
      and(
        eq(schema.attempts.userId, userId),
        inArray(schema.attempts.taskId, taskIds as string[]),
        gte(schema.attempts.createdAt, since),
      ),
    );
}

export async function getSkillIdsForTasks(
  db: Database,
  taskIds: readonly string[],
): Promise<string[]> {
  if (taskIds.length === 0) return [];
  const rows = await db
    .select({ skillId: schema.taskSkills.skillId })
    .from(schema.taskSkills)
    .where(inArray(schema.taskSkills.taskId, taskIds as string[]));
  return rows.map((r) => r.skillId);
}

/** Real `mistakes` rows for this user on one of `taskIds` whose
 * `createdAt` (first-ever-wrong-attempt time) falls at or after
 * `since` — a mistake merely UPDATED during the session (e.g.
 * resolved by a later correct attempt) but originally created earlier
 * is correctly excluded, matching "mistakesCreated" literally. */
export async function countMistakesCreatedSince(
  db: Database,
  userId: string,
  taskIds: readonly string[],
  since: Date,
): Promise<number> {
  if (taskIds.length === 0) return 0;
  const rows = await db
    .select({ id: schema.mistakes.id })
    .from(schema.mistakes)
    .where(
      and(
        eq(schema.mistakes.userId, userId),
        inArray(schema.mistakes.taskId, taskIds as string[]),
        gte(schema.mistakes.createdAt, since),
      ),
    );
  return rows.length;
}
