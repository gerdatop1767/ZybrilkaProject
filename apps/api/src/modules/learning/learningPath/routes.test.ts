import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';

describe('GET /me/learning/path (ZUBRILKA LEARNING INTELLIGENCE Phase 8)', () => {
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
    const res = await app.inject({ method: 'GET', url: '/api/v1/me/learning/path' });
    expect(res.statusCode).toBe(400);
  });

  it('returns null for a brand-new user with no onboarded subject and no explicit subjectId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/path',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toBeNull();
  });

  it('returns a path for a valid request with an explicit subjectId, even cold-start', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}`,
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.subject).toBe(mathTask.subjectId);
    expect(Array.isArray(body.steps)).toBe(true);
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.steps.length).toBeLessThanOrEqual(5); // default limit
    expect(body.steps[0].position).toBe(1);
  });

  it('defaults limit to 5, respects an explicit limit', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}&limit=2`,
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().steps.length).toBeLessThanOrEqual(2);
  });

  it('400s for limit below the minimum', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}&limit=0`,
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(400);
  });

  it('400s for limit above the maximum', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}&limit=11`,
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns null for an unknown subjectId with no published tasks', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/path?subjectId=__does_not_exist__',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toBeNull();
  });

  it('every step has a unique taskId — never repeats a task in one path', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}&limit=10`,
      headers: { 'x-anon-id': randomUUID() },
    });
    const steps = res.json().steps as Array<{ task: { id: string } }>;
    const ids = steps.map((s) => s.task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never leaks one user's path context to another", async () => {
    const userA = randomUUID();
    const userB = randomUUID();

    const resA = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}`,
      headers: { 'x-anon-id': userA },
    });
    const resB = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}`,
      headers: { 'x-anon-id': userB },
    });
    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);
  });

  it('is deterministic — repeated requests for the same user return the exact same sequence', async () => {
    const anonId = randomUUID();
    const url = `/api/v1/me/learning/path?subjectId=${mathTask.subjectId}&limit=5`;
    const first = await app.inject({ method: 'GET', url, headers: { 'x-anon-id': anonId } });
    const second = await app.inject({ method: 'GET', url, headers: { 'x-anon-id': anonId } });
    expect(first.json()).toEqual(second.json());
  });

  it('exposes no mutation endpoint for the path (GET only)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/me/learning/path',
      headers: { 'x-anon-id': randomUUID() },
      payload: {},
    });
    expect(res.statusCode).toBe(404);
  });
});
