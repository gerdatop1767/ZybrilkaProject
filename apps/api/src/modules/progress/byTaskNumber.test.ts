import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import type { ProgressByTaskNumberResponse } from '@zybrilka/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * Real per-task-number coverage (X/Y). Uses createImportedTestDb so
 * taskNumber=1 has real, genuinely different-source tasks to test
 * against: 2 demo-seed tasks (source: DEMO_SOURCE, no collection
 * membership) + 1 real Ященко ЕГЭ 2026 Вариант 1 task (source:
 * Ященко, collection "ege-2026-yashchenko") — exactly the "another
 * source must not leak in" scenario this endpoint has to get right.
 */
describe('GET /api/v1/progress/by-task-number', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;
  let seedTaskA: { id: string; correctAnswer: string };
  let seedTaskB: { id: string; correctAnswer: string };
  let yashchenkoTaskNumber1: { id: string };

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    app = buildApp({ version: 'test', db: testDb.db });

    const number1Tasks = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 1));
    const yashchenko = number1Tasks.find((t) => t.source.includes('Ященко'))!;
    const seeds = number1Tasks.filter((t) => !t.source.includes('Ященко'));
    expect(seeds).toHaveLength(2);
    seedTaskA = seeds[0]!;
    seedTaskB = seeds[1]!;
    yashchenkoTaskNumber1 = yashchenko;
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  function attempt(anonId: string, taskId: string, answer: string) {
    return app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${taskId}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer },
    });
  }

  function byTaskNumber(anonId: string, qs = '') {
    return app.inject({
      method: 'GET',
      url: `/api/v1/progress/by-task-number${qs}`,
      headers: { 'x-anon-id': anonId },
    });
  }

  function findNumber1(items: ProgressByTaskNumberResponse['items']) {
    return items.find((i) => i.taskNumber === 1);
  }

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/progress/by-task-number' });
    expect(res.statusCode).toBe(400);
  });

  it('a brand-new user has 0 completed but a real, non-zero total', async () => {
    const res = await byTaskNumber(randomUUID(), '?subject=math');
    const row = findNumber1(res.json().items);
    expect(row).toMatchObject({ completed: 0 });
    expect(row!.total).toBe(3); // 2 seed tasks + 1 Ященко task, aggregate scope
  });

  it('one attempt on task A makes it 1/Y', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'anything');
    const res = await byTaskNumber(anonId, '?subject=math');
    expect(findNumber1(res.json().items)).toMatchObject({ completed: 1, total: 3 });
  });

  it('a repeat attempt on the same task does not inflate completed', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'first try');
    await attempt(anonId, seedTaskA.id, 'second try');
    await attempt(anonId, seedTaskA.id, 'third try');
    const res = await byTaskNumber(anonId, '?subject=math');
    expect(findNumber1(res.json().items)).toMatchObject({ completed: 1, total: 3 });
  });

  it('a second, different task raises completed to 2/Y', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'x');
    await attempt(anonId, seedTaskB.id, 'y');
    const res = await byTaskNumber(anonId, '?subject=math');
    expect(findNumber1(res.json().items)).toMatchObject({ completed: 2, total: 3 });
  });

  it("another user's attempts never affect this user's completed count", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    await attempt(userA, seedTaskA.id, 'x');
    await attempt(userB, seedTaskB.id, 'y');
    await attempt(userB, yashchenkoTaskNumber1.id, 'z');

    const resA = await byTaskNumber(userA, '?subject=math');
    expect(findNumber1(resA.json().items)).toMatchObject({ completed: 1, total: 3 });
  });

  it('scoping to the Ященко collection excludes other-source tasks from total and completed', async () => {
    const anonId = randomUUID();
    // Answer both demo-seed tasks — neither belongs to the collection.
    await attempt(anonId, seedTaskA.id, 'x');
    await attempt(anonId, seedTaskB.id, 'y');

    const res = await byTaskNumber(anonId, '?subject=math&collection=ege-2026-yashchenko');
    expect(findNumber1(res.json().items)).toMatchObject({ completed: 0, total: 1 });
  });

  it('answering the Ященко task under the Ященко collection scope counts it', async () => {
    const anonId = randomUUID();
    await attempt(anonId, yashchenkoTaskNumber1.id, 'z');

    const scoped = await byTaskNumber(anonId, '?subject=math&collection=ege-2026-yashchenko');
    expect(findNumber1(scoped.json().items)).toMatchObject({ completed: 1, total: 1 });

    // Same attempt, no collection filter: total widens back to the aggregate bank.
    const aggregate = await byTaskNumber(anonId, '?subject=math');
    expect(findNumber1(aggregate.json().items)).toMatchObject({ completed: 1, total: 3 });
  });

  it('an unknown collection slug yields total=0, not an error', async () => {
    const res = await byTaskNumber(randomUUID(), '?subject=math&collection=does-not-exist');
    expect(res.statusCode).toBe(200);
    expect(findNumber1(res.json().items)).toBeUndefined();
  });

  it('a brand-new user with no attempts has null accuracyPercent, not a fabricated 0', async () => {
    const res = await byTaskNumber(randomUUID(), '?subject=math');
    expect(findNumber1(res.json().items)).toMatchObject({
      correct: 0,
      incorrect: 0,
      accuracyPercent: null,
    });
  });

  it('real correct/incorrect attempts produce a real accuracyPercent, separate from completed', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, '__definitely_wrong__');
    await attempt(anonId, seedTaskA.id, seedTaskA.correctAnswer);
    await attempt(anonId, seedTaskB.id, '__also_wrong__');
    const row = findNumber1((await byTaskNumber(anonId, '?subject=math')).json().items);
    // completed: 2 unique tasks attempted (seedTaskA + seedTaskB), out
    // of 3 total — a completely different ratio from accuracy below,
    // proving the two are never conflated.
    expect(row).toMatchObject({ completed: 2, total: 3 });
    // 3 attempts total, 1 correct (the retry on seedTaskA).
    expect(row).toMatchObject({ correct: 1, incorrect: 2, accuracyPercent: 33 });
  });

  it('variant filter narrows the same way as collection', async () => {
    const [variant] = await testDb.db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.variantNumber, 1));
    const anonId = randomUUID();
    await attempt(anonId, yashchenkoTaskNumber1.id, 'z');

    const res = await byTaskNumber(anonId, `?subject=math&variant=${variant!.id}`);
    expect(findNumber1(res.json().items)).toMatchObject({ completed: 1, total: 1 });
  });
});
