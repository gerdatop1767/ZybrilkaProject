import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { eq, sql } from 'drizzle-orm';

/** Increments the running count for one (userId, errorSignature) pair
 * by exactly 1 — never a full overwrite, since this is a plain tally,
 * not a recomputed formula (contrast with Phase 3/4's upsert pattern).
 * `lastOccurredAt` only ever moves forward (`GREATEST`), so replaying
 * history out of order during a rebuild still ends at the true latest
 * occurrence. */
export async function incrementUserErrorStatistic(
  db: Database,
  userId: string,
  errorSignature: string,
  occurredAt: Date,
): Promise<void> {
  await db
    .insert(schema.userErrorStatistics)
    .values({ userId, errorSignature, count: 1, lastOccurredAt: occurredAt })
    .onConflictDoUpdate({
      target: [schema.userErrorStatistics.userId, schema.userErrorStatistics.errorSignature],
      set: {
        count: sql`${schema.userErrorStatistics.count} + 1`,
        lastOccurredAt: sql`greatest(${schema.userErrorStatistics.lastOccurredAt}, ${occurredAt.toISOString()}::timestamptz)`,
        updatedAt: new Date(),
      },
    });
}

export interface UserErrorStatisticRow {
  readonly errorSignature: string;
  readonly count: number;
  readonly lastOccurredAt: Date | null;
}

export async function getUserErrorStatistics(
  db: Database,
  userId: string,
): Promise<UserErrorStatisticRow[]> {
  return db
    .select({
      errorSignature: schema.userErrorStatistics.errorSignature,
      count: schema.userErrorStatistics.count,
      lastOccurredAt: schema.userErrorStatistics.lastOccurredAt,
    })
    .from(schema.userErrorStatistics)
    .where(eq(schema.userErrorStatistics.userId, userId));
}

/** Used by `rebuildUserErrorStatistics` (full replay from scratch) and tests. */
export async function deleteUserErrorStatistics(db: Database, userId: string): Promise<void> {
  await db.delete(schema.userErrorStatistics).where(eq(schema.userErrorStatistics.userId, userId));
}

export interface AttemptForErrorDetection {
  readonly answerRaw: string;
  readonly isCorrect: boolean;
  readonly createdAt: Date;
  readonly answerType: (typeof schema.taskAnswerTypes)[number];
  readonly correctAnswer: string;
}

/** Every attempt the user has ever made, joined to its task's
 * answerType/correctAnswer — everything `detectErrorSignatures` needs
 * to re-derive the exact same signatures it produced at write time. */
export async function getAttemptsForErrorDetection(
  db: Database,
  userId: string,
): Promise<AttemptForErrorDetection[]> {
  return db
    .select({
      answerRaw: schema.attempts.answerRaw,
      isCorrect: schema.attempts.isCorrect,
      createdAt: schema.attempts.createdAt,
      answerType: schema.tasks.answerType,
      correctAnswer: schema.tasks.correctAnswer,
    })
    .from(schema.attempts)
    .innerJoin(schema.tasks, eq(schema.attempts.taskId, schema.tasks.id))
    .where(eq(schema.attempts.userId, userId));
}

export async function getDistinctAttemptUserIds(db: Database): Promise<string[]> {
  const rows = await db.selectDistinct({ userId: schema.attempts.userId }).from(schema.attempts);
  return rows.map((r) => r.userId);
}
