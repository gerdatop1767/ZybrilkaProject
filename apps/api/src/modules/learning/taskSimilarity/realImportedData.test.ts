import { schema } from '@zybrilka/db';
import { createImportedVariantsTestDb } from '@zybrilka/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getSimilarTasks } from './service.js';

/**
 * Block D (import EGE 2026 variants 2-5): proves the taskNumber hard
 * filter (commit 7b311ca, apps/api/src/modules/learning/taskSimilarity/
 * repo.ts) still holds on REAL imported rows spanning two real exam
 * variants (Вариант 1 and Вариант 2 of the same Ященко collection),
 * not just the synthetic adversarial fixture in sameTaskNumber.test.ts.
 * Вариант 1's task №7 and Вариант 2's task №7 are both real, genuinely
 * different tasks (different topic/skills/condition) — Similar Tasks
 * for one must only ever surface the other same-numbered task, never
 * a different-numbered one from either variant.
 */
describe('getSimilarTasks — real imported data (Вариант 1 + Вариант 2), same taskNumber only', () => {
  let testDb: Awaited<ReturnType<typeof createImportedVariantsTestDb>>;

  beforeAll(async () => {
    testDb = await createImportedVariantsTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('Вариант 1 task №7 only ever surfaces другого taskNumber=7 task, never a different number', async () => {
    const { db } = testDb;
    const [v1task7] = await db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.subjectId, 'math'),
          eq(schema.tasks.taskNumber, 7),
          eq(schema.tasks.sourceVariant, 1),
        ),
      );
    expect(v1task7).toBeDefined();

    const similar = await getSimilarTasks(db, v1task7!.id, 20);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.every((r) => r.taskNumber === 7)).toBe(true);
    expect(similar.every((r) => r.taskId !== v1task7!.id)).toBe(true);
  });

  it('Вариант 2 task №7 surfaces Вариант 1 task №7 as a candidate', async () => {
    const { db } = testDb;
    const [v1task7] = await db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.subjectId, 'math'),
          eq(schema.tasks.taskNumber, 7),
          eq(schema.tasks.sourceVariant, 1),
        ),
      );
    const [v2task7] = await db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.subjectId, 'math'),
          eq(schema.tasks.taskNumber, 7),
          eq(schema.tasks.sourceVariant, 2),
        ),
      );

    const similar = await getSimilarTasks(db, v2task7!.id, 20);
    expect(similar.map((r) => r.taskId)).toContain(v1task7!.id);
    expect(similar.every((r) => r.taskNumber === 7)).toBe(true);
  });

  it('every real task number 1-19 that exists in both variants only ever cross-links within its own number', async () => {
    const { db } = testDb;
    const allTasks = await db
      .select({ id: schema.tasks.id, taskNumber: schema.tasks.taskNumber })
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));

    for (const task of allTasks) {
      const similar = await getSimilarTasks(db, task.id, 20);
      for (const candidate of similar) {
        expect(candidate.taskNumber).toBe(task.taskNumber);
      }
    }
  });
});
