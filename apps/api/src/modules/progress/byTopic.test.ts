import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import type { ProgressByTopicResponse } from '@zybrilka/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * Real per-topic coverage (X/Y) — same total/completed contract and
 * source-isolation rules as /progress/by-task-number (Block A), grouped
 * by the real `topics` table (topicId/topicName) instead of task
 * number. Uses createImportedTestDb: the two demo-seed таskNumber=1
 * tasks share topic "Числа и вычисления" (practical-arithmetic), and
 * Ященко ЕГЭ 2026 Вариант 1's task 1 is a *different* real topic
 * ("Планиметрия" / planimetry-triangles) — exactly the source-leak
 * scenario this endpoint has to get right.
 */
describe('GET /api/v1/progress/by-topic', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;
  let seedTaskA: { id: string };
  let seedTaskB: { id: string };
  let arithmeticTopicId: string;
  let yashchenkoTask1: { id: string };
  let planimetryTopicId: string;

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
    arithmeticTopicId = seeds[0]!.topicId!;
    yashchenkoTask1 = yashchenko;
    planimetryTopicId = yashchenko.topicId!;
    expect(arithmeticTopicId).not.toBe(planimetryTopicId);
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

  function byTopic(anonId: string, qs = '') {
    return app.inject({
      method: 'GET',
      url: `/api/v1/progress/by-topic${qs}`,
      headers: { 'x-anon-id': anonId },
    });
  }

  function findTopic(items: ProgressByTopicResponse['items'], topicId: string) {
    return items.find((i) => i.topicId === topicId);
  }

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/progress/by-topic' });
    expect(res.statusCode).toBe(400);
  });

  it('a brand-new user has 0 completed but a real, non-zero total', async () => {
    const res = await byTopic(randomUUID(), '?subject=math');
    const row = findTopic(res.json().items, arithmeticTopicId);
    expect(row).toMatchObject({ completed: 0, total: 2 });
  });

  it('one attempt on task A makes it 1/Y', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'anything');
    const res = await byTopic(anonId, '?subject=math');
    expect(findTopic(res.json().items, arithmeticTopicId)).toMatchObject({
      completed: 1,
      total: 2,
    });
  });

  it('a repeat attempt on the same task does not inflate completed', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'first try');
    await attempt(anonId, seedTaskA.id, 'second try');
    await attempt(anonId, seedTaskA.id, 'third try');
    const res = await byTopic(anonId, '?subject=math');
    expect(findTopic(res.json().items, arithmeticTopicId)).toMatchObject({
      completed: 1,
      total: 2,
    });
  });

  it('a second, different task in the same topic raises completed to 2/Y', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'x');
    await attempt(anonId, seedTaskB.id, 'y');
    const res = await byTopic(anonId, '?subject=math');
    expect(findTopic(res.json().items, arithmeticTopicId)).toMatchObject({
      completed: 2,
      total: 2,
    });
  });

  it("another user's attempts never affect this user's completed count", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    await attempt(userA, seedTaskA.id, 'x');
    await attempt(userB, seedTaskB.id, 'y');

    const resA = await byTopic(userA, '?subject=math');
    expect(findTopic(resA.json().items, arithmeticTopicId)).toMatchObject({
      completed: 1,
      total: 2,
    });
  });

  it('scoping to the Ященко collection excludes other-source topics entirely', async () => {
    const anonId = randomUUID();
    await attempt(anonId, seedTaskA.id, 'x');

    const res = await byTopic(anonId, '?subject=math&collection=ege-2026-yashchenko');
    expect(findTopic(res.json().items, arithmeticTopicId)).toBeUndefined();
  });

  it('answering the Ященко task under the Ященко collection scope counts it', async () => {
    const anonId = randomUUID();
    await attempt(anonId, yashchenkoTask1.id, 'z');

    const scoped = await byTopic(anonId, '?subject=math&collection=ege-2026-yashchenko');
    expect(findTopic(scoped.json().items, planimetryTopicId)).toMatchObject({
      completed: 1,
      total: 1,
    });

    // Same attempt, no collection filter: aggregate bank still sees it,
    // but general-bank scope must never merge it into the unrelated
    // arithmetic topic.
    const aggregate = await byTopic(anonId, '?subject=math');
    expect(findTopic(aggregate.json().items, planimetryTopicId)).toMatchObject({
      completed: 1,
      total: 1,
    });
    expect(findTopic(aggregate.json().items, arithmeticTopicId)).toMatchObject({
      completed: 0,
      total: 2,
    });
  });

  it('an unknown collection slug yields no rows, not an error', async () => {
    const res = await byTopic(randomUUID(), '?subject=math&collection=does-not-exist');
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toEqual([]);
  });

  it('variant filter narrows the same way as collection', async () => {
    const [variant] = await testDb.db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.variantNumber, 1));
    const anonId = randomUUID();
    await attempt(anonId, yashchenkoTask1.id, 'z');

    const res = await byTopic(anonId, `?subject=math&variant=${variant!.id}`);
    expect(findTopic(res.json().items, planimetryTopicId)).toMatchObject({
      completed: 1,
      total: 1,
    });
    expect(findTopic(res.json().items, arithmeticTopicId)).toBeUndefined();
  });

  it('percentage for a topic with total=0 (theoretical) is never computed client-side from a missing row', async () => {
    // total=0 topics simply never appear in `items` (see the
    // unknown-collection test above) — a client rendering percent must
    // treat a missing row as 0%, not divide by zero.
    const res = await byTopic(randomUUID(), '?subject=math&collection=does-not-exist');
    expect(res.json().items).toEqual([]);
  });
});
