import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { and, desc, eq } from 'drizzle-orm';

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 8 — the only genuinely NEW
 * query this phase needs. Every other data access (candidate pool,
 * correctly-attempted tasks, skill mastery, open mistakes, subject
 * existence) is already exposed by Phase 7's
 * `../recommendation/repo.js` and reused as-is — see `service.ts`.
 */

/** The user's most recently correctly-solved tasks in this subject,
 * most-recent first, capped at `limit` — the real "recently solved"
 * reference pool `similarityBonus` can relate a later path step to
 * (per Phase 8 spec §5: similarity may target an open mistake, a
 * previously selected step, OR a recently solved task). Ties on
 * `createdAt` (same millisecond) are broken by `attempts.id` purely
 * for determinism — that ordering carries no claimed meaning beyond
 * "the same DB state always returns the same order". */
export async function getRecentlyCorrectlySolvedTaskIds(
  db: Database,
  userId: string,
  subjectId: string,
  limit: number,
): Promise<string[]> {
  const rows = await db
    .select({ taskId: schema.attempts.taskId })
    .from(schema.attempts)
    .innerJoin(schema.tasks, eq(schema.tasks.id, schema.attempts.taskId))
    .where(
      and(
        eq(schema.attempts.userId, userId),
        eq(schema.attempts.isCorrect, true),
        eq(schema.tasks.subjectId, subjectId),
      ),
    )
    .orderBy(desc(schema.attempts.createdAt), desc(schema.attempts.id));

  const seen = new Set<string>();
  const result: string[] = [];
  for (const row of rows) {
    if (seen.has(row.taskId)) continue;
    seen.add(row.taskId);
    result.push(row.taskId);
    if (result.length >= limit) break;
  }
  return result;
}
