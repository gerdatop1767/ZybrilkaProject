import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { syncSkillsFromCanonicalSolutions } from '../skills/sync.js';

describe('GET /me/learning/mastery (ZUBRILKA LEARNING INTELLIGENCE Phase 3)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    await syncSkillsFromCanonicalSolutions(testDb.db);
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  async function anyTaskWithSkills() {
    const [link] = await testDb.db.select().from(schema.taskSkills).limit(1);
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, link!.taskId));
    return task;
  }

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me/learning/mastery' });
    expect(res.statusCode).toBe(400);
  });

  it('a brand-new user gets an empty items array, not an error', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/mastery',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ items: [] });
  });

  it('returns mastery/confidence/attempts after a real attempt, scoped to the real task_skills link', async () => {
    const task = await anyTaskWithSkills();
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task!.correctAnswer },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/mastery',
      headers: { 'x-anon-id': anonId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item).toHaveProperty('subjectId');
      expect(item).toHaveProperty('skillId');
      expect(item).toHaveProperty('skillSlug');
      expect(item).toHaveProperty('skillName');
      expect(item).toHaveProperty('mastery');
      expect(item).toHaveProperty('confidence');
      expect(item).toHaveProperty('attempts', 1);
      expect(item).toHaveProperty('correctAttempts', 1);
      expect(item).toHaveProperty('incorrectAttempts', 0);
      expect(item).toHaveProperty('lastAttemptAt');
      expect(item.lastAttemptAt).not.toBeNull();
    }
  });

  it("never leaks one user's mastery to another — each user only ever sees their own", async () => {
    const task = await anyTaskWithSkills();
    const userOne = randomUUID();
    const userTwo = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': userOne },
      payload: { answer: task!.correctAnswer },
    });

    const userTwoRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/mastery',
      headers: { 'x-anon-id': userTwo },
    });
    expect(userTwoRes.json()).toEqual({ items: [] });
  });

  it("there is no way to request another user's mastery via query/body — userId always comes from the server-resolved anon header", async () => {
    const task = await anyTaskWithSkills();
    const victim = randomUUID();
    const attacker = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': victim },
      payload: { answer: task!.correctAnswer },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/mastery?userId=${victim}`,
      headers: { 'x-anon-id': attacker },
    });
    expect(res.json()).toEqual({ items: [] });
  });
});
