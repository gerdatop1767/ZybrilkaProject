import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from './schema.js';
import { createSeededTestDb } from './testing.js';

describe('task_statistics (ZUBRILKA LEARNING INTELLIGENCE Phase 4)', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;
  let taskIds: string[] = [];

  beforeAll(async () => {
    testDb = await createSeededTestDb();
    const tasks = await testDb.db.select().from(schema.tasks).limit(5);
    taskIds = tasks.map((t) => t.id);
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('creates a row with the expected cold-start defaults', async () => {
    const { db } = testDb;
    const taskId = taskIds[0]!;

    const [row] = await db.insert(schema.taskStatistics).values({ taskId }).returning();

    expect(row?.attempts).toBe(0);
    expect(row?.correctAttempts).toBe(0);
    expect(row?.incorrectAttempts).toBe(0);
    expect(row?.accuracy).toBeNull();
    expect(row?.difficulty).toBeNull();
    expect(row?.confidence).toBe(0);
    expect(row?.averageTimeMs).toBeNull();
    expect(row?.lastAttemptAt).toBeNull();
  });

  it('rejects an invalid taskId (FK)', async () => {
    const { db } = testDb;
    await expect(
      db.insert(schema.taskStatistics).values({ taskId: crypto.randomUUID() }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate taskId (unique)', async () => {
    const { db } = testDb;
    const taskId = taskIds[1]!;
    await db.insert(schema.taskStatistics).values({ taskId });
    await expect(db.insert(schema.taskStatistics).values({ taskId })).rejects.toThrow();
  });

  it('onConflictDoUpdate on taskId updates in place rather than duplicating', async () => {
    const { db } = testDb;
    const taskId = taskIds[2]!;

    await db
      .insert(schema.taskStatistics)
      .values({
        taskId,
        attempts: 1,
        correctAttempts: 1,
        accuracy: 100,
        difficulty: 45,
        confidence: 10,
      })
      .onConflictDoUpdate({
        target: schema.taskStatistics.taskId,
        set: { attempts: 1, correctAttempts: 1, accuracy: 100, difficulty: 45, confidence: 10 },
      });

    await db
      .insert(schema.taskStatistics)
      .values({
        taskId,
        attempts: 2,
        correctAttempts: 1,
        accuracy: 50,
        difficulty: 50,
        confidence: 20,
      })
      .onConflictDoUpdate({
        target: schema.taskStatistics.taskId,
        set: { attempts: 2, correctAttempts: 1, accuracy: 50, difficulty: 50, confidence: 20 },
      });

    const rows = await db
      .select()
      .from(schema.taskStatistics)
      .where(eq(schema.taskStatistics.taskId, taskId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.attempts).toBe(2);
    expect(rows[0]?.difficulty).toBe(50);
  });

  it('never touches the authored tasks.difficulty column', async () => {
    const { db } = testDb;
    const taskId = taskIds[3]!;
    const [before] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));

    await db
      .insert(schema.taskStatistics)
      .values({ taskId, attempts: 10, correctAttempts: 0, difficulty: 100, confidence: 100 });

    const [after] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
    expect(after?.difficulty).toBe(before?.difficulty);
  });
});
