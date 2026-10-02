import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createSeededTestDb } from '@zybrilka/db/testing';
import { ne } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * GET /api/v1/progress/daily — real per-day attempts from
 * `attempts.createdAt`, UTC calendar day, deduped to distinct tasks per
 * day (Block D). Attempts are inserted directly (not via the API) so
 * `createdAt` can be pinned to exact days instead of "now". The
 * `x-anon-id` header value *is* `users.id` directly (see
 * apps/api/src/plugins/anonUser.ts), so a plain `randomUUID()` used as
 * both the header and the inserted attempt's `userId` is enough — no
 * separate user-row setup needed, the anon-user hook upserts it lazily
 * on the request itself.
 */
describe('GET /api/v1/progress/daily', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;
  let app: ReturnType<typeof buildApp>;
  let taskA: { id: string; subjectId: string };
  let taskB: { id: string; subjectId: string };

  beforeAll(async () => {
    testDb = await createSeededTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
    const tasks = await testDb.db.select().from(schema.tasks).limit(2);
    taskA = tasks[0]!;
    taskB = tasks[1]!;
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  function daily(anonId: string, qs = '') {
    return app.inject({
      method: 'GET',
      url: `/api/v1/progress/daily${qs}`,
      headers: { 'x-anon-id': anonId },
    });
  }

  async function insertAttempt(input: {
    userId: string;
    taskId: string;
    isCorrect: boolean;
    createdAt: Date;
  }) {
    // The user row must exist before the FK insert — a lightweight
    // GET satisfies the anon-user plugin's lazy upsert.
    await app.inject({
      method: 'GET',
      url: '/api/v1/progress/summary',
      headers: { 'x-anon-id': input.userId },
    });
    await testDb.db.insert(schema.attempts).values({
      userId: input.userId,
      taskId: input.taskId,
      answerRaw: 'x',
      isCorrect: input.isCorrect,
      createdAt: input.createdAt,
    });
  }

  function daysAgo(n: number): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    d.setUTCHours(12, 0, 0, 0); // safely mid-day UTC, never crosses into an adjacent day
    return d;
  }

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/progress/daily' });
    expect(res.statusCode).toBe(400);
  });

  it('a brand-new user has no days', async () => {
    const res = await daily(randomUUID(), '?days=30');
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toEqual([]);
  });

  it('one attempt today produces one day row with solved=1, accuracyPercent=100', async () => {
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    const res = await daily(anonId, '?days=7');
    expect(res.json().items).toHaveLength(1);
    expect(res.json().items[0]).toMatchObject({ solved: 1, accuracyPercent: 100 });
  });

  it('a repeat attempt on the same task, same day, does not inflate solved', async () => {
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: false,
      createdAt: daysAgo(0),
    });
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    const res = await daily(anonId, '?days=7');
    expect(res.json().items).toHaveLength(1);
    // Correct on at least one attempt that day → the distinct task counts as correct.
    expect(res.json().items[0]).toMatchObject({ solved: 1, accuracyPercent: 100 });
  });

  it('a second distinct task the same day raises solved to 2', async () => {
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    await insertAttempt({
      userId: anonId,
      taskId: taskB.id,
      isCorrect: false,
      createdAt: daysAgo(0),
    });
    const res = await daily(anonId, '?days=7');
    expect(res.json().items).toHaveLength(1);
    expect(res.json().items[0]).toMatchObject({ solved: 2, accuracyPercent: 50 });
  });

  it('attempts on two different days produce two separate day rows', async () => {
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(1),
    });
    await insertAttempt({
      userId: anonId,
      taskId: taskB.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    const res = await daily(anonId, '?days=7');
    expect(res.json().items).toHaveLength(2);
    expect(res.json().items.map((i: { solved: number }) => i.solved)).toEqual([1, 1]);
  });

  it('a day outside the requested window is excluded', async () => {
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(10),
    });
    const res = await daily(anonId, '?days=3');
    expect(res.json().items).toEqual([]);
  });

  it("another user's attempts never affect this user's daily rows", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    await insertAttempt({
      userId: userB,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    const res = await daily(userA, '?days=7');
    expect(res.json().items).toEqual([]);
  });

  it('rejects an out-of-range days value', async () => {
    const res = await daily(randomUUID(), '?days=0');
    expect(res.statusCode).toBe(400);
    const res2 = await daily(randomUUID(), '?days=91');
    expect(res2.statusCode).toBe(400);
  });

  it('a subject filter scopes the daily activity to that subject only', async () => {
    const otherSubjectTask = (
      await testDb.db
        .select()
        .from(schema.tasks)
        .where(ne(schema.tasks.subjectId, taskA.subjectId))
        .limit(1)
    )[0];
    if (!otherSubjectTask) return; // seed has only one subject — nothing to assert
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    await insertAttempt({
      userId: anonId,
      taskId: otherSubjectTask.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });

    const aggregate = await daily(anonId, '?days=7');
    expect(aggregate.json().items[0]).toMatchObject({ solved: 2 });

    const scoped = await daily(anonId, `?days=7&subject=${taskA.subjectId}`);
    expect(scoped.json().items[0]).toMatchObject({ solved: 1 });
  });

  it('defaults to a sensible window when days is omitted', async () => {
    const anonId = randomUUID();
    await insertAttempt({
      userId: anonId,
      taskId: taskA.id,
      isCorrect: true,
      createdAt: daysAgo(0),
    });
    const res = await daily(anonId);
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(1);
  });
});
