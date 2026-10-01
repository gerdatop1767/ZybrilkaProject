import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getSimilarTasks } from './service.js';

describe('getSimilarTasks (ZUBRILKA LEARNING INTELLIGENCE Phase 6)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('returns [] for an unknown taskId, never throws', async () => {
    const result = await getSimilarTasks(testDb.db, '00000000-0000-0000-0000-000000000000', 5);
    expect(result).toEqual([]);
  });

  it('never returns the source task among its own similar tasks', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const result = await getSimilarTasks(testDb.db, task!.id, 20);
    expect(result.every((entry) => entry.taskId !== task!.id)).toBe(true);
  });

  it('only returns tasks from the same subject', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const result = await getSimilarTasks(testDb.db, task!.id, 20);

    const allTasks = await testDb.db.select().from(schema.tasks);
    const bySubject = new Map(allTasks.map((t) => [t.id, t.subjectId]));

    for (const entry of result) {
      expect(bySubject.get(entry.taskId)).toBe(task!.subjectId);
    }
  });

  it('is deterministic — same input always produces the same ordered output', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 14));
    const first = await getSimilarTasks(testDb.db, task!.id, 10);
    const second = await getSimilarTasks(testDb.db, task!.id, 10);
    expect(first).toEqual(second);
  });

  it('respects the limit parameter', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const result = await getSimilarTasks(testDb.db, task!.id, 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('scores are sorted descending, highest similarity first', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const result = await getSimilarTasks(testDb.db, task!.id, 20);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.score).toBeGreaterThanOrEqual(result[i]!.score);
    }
  });
});
