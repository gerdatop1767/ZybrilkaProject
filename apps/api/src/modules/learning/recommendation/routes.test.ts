import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';

describe('GET /me/learning/next-task (ZUBRILKA LEARNING INTELLIGENCE Phase 7)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;
  let mathTask: typeof schema.tasks.$inferSelect;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'))
      .limit(1);
    mathTask = task!;
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me/learning/next-task' });
    expect(res.statusCode).toBe(400);
  });

  it('returns null for a brand-new user with no onboarded subject and no explicit subjectId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/next-task',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ recommendation: null });
  });

  it('returns a recommendation when an explicit subjectId is given, even cold-start', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/next-task?subjectId=${mathTask.subjectId}`,
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.recommendation).not.toBeNull();
    expect(body.recommendation.subjectId).toBe(mathTask.subjectId);
    expect(typeof body.recommendation.score).toBe('number');
    expect(body.recommendation.score).toBeGreaterThanOrEqual(0);
    expect(body.recommendation.score).toBeLessThanOrEqual(100);
    expect(typeof body.recommendation.reason).toBe('string');
  });

  it('returns null for an unknown subjectId with no published tasks', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/next-task?subjectId=__does_not_exist__',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ recommendation: null });
  });

  it('auto-resolves the subject from the onboarded learning profile when none is given', async () => {
    const anonId = randomUUID();
    await app.inject({
      method: 'PUT',
      url: '/api/v1/me/learning-profile',
      headers: { 'x-anon-id': anonId },
      payload: {
        subjects: [
          { subjectId: mathTask.subjectId, selfReportedScore: 'under_40', targetScore: '90_plus' },
        ],
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/next-task',
      headers: { 'x-anon-id': anonId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().recommendation.subjectId).toBe(mathTask.subjectId);
  });

  it('is deterministic — same user state always returns the same recommendation', async () => {
    const anonId = randomUUID();
    const url = `/api/v1/me/learning/next-task?subjectId=${mathTask.subjectId}`;
    const first = await app.inject({ method: 'GET', url, headers: { 'x-anon-id': anonId } });
    const second = await app.inject({ method: 'GET', url, headers: { 'x-anon-id': anonId } });
    expect(first.json()).toEqual(second.json());
  });

  it("never leaks one user's recommendation context to another — different users can get different results", async () => {
    const userA = randomUUID();
    const userB = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${mathTask.id}/attempt`,
      headers: { 'x-anon-id': userA },
      payload: { answer: mathTask.correctAnswer },
    });

    const resA = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/next-task?subjectId=${mathTask.subjectId}`,
      headers: { 'x-anon-id': userA },
    });
    const resB = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/next-task?subjectId=${mathTask.subjectId}`,
      headers: { 'x-anon-id': userB },
    });

    // userA solved mathTask correctly, so it should never be A's own recommendation
    // again while unsolved alternatives exist in the subject.
    expect(resA.json().recommendation?.taskId).not.toBe(mathTask.id);
    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);
  });

  it('exposes no mutation endpoint for the recommendation (GET only)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/learning/next-task',
      headers: { 'x-anon-id': randomUUID() },
      payload: {},
    });
    expect(res.statusCode).toBe(404);
  });
});
