import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createSeededTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('favorites (Task Workspace block — real bookmark state)', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createSeededTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  async function taskByNumber(n: number) {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, n));
    return task!;
  }

  it('GET/POST/DELETE all require an x-anon-id header', async () => {
    const get = await app.inject({ method: 'GET', url: '/api/v1/favorites' });
    expect(get.statusCode).toBe(400);
    const post = await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      payload: { taskId: randomUUID() },
    });
    expect(post.statusCode).toBe(400);
    const del = await app.inject({ method: 'DELETE', url: `/api/v1/favorites/${randomUUID()}` });
    expect(del.statusCode).toBe(400);
  });

  it('POST 404s for a task id that does not exist', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
      payload: { taskId: randomUUID() },
    });
    expect(res.statusCode).toBe(404);
  });

  it('adds a favorite, lists it, and removing it makes it disappear (add/remove/status)', async () => {
    const task = await taskByNumber(1);
    const anonId = randomUUID();

    const before = await app.inject({
      method: 'GET',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
    });
    expect(before.json().taskIds).not.toContain(task.id);

    const add = await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
      payload: { taskId: task.id },
    });
    expect(add.statusCode).toBe(204);

    const after = await app.inject({
      method: 'GET',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
    });
    expect(after.json().taskIds).toContain(task.id);

    const remove = await app.inject({
      method: 'DELETE',
      url: `/api/v1/favorites/${task.id}`,
      headers: { 'x-anon-id': anonId },
    });
    expect(remove.statusCode).toBe(204);

    const afterRemove = await app.inject({
      method: 'GET',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
    });
    expect(afterRemove.json().taskIds).not.toContain(task.id);
  });

  it('adding the same task twice never duplicates it (idempotent add)', async () => {
    const task = await taskByNumber(2);
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
      payload: { taskId: task.id },
    });
    await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
      payload: { taskId: task.id },
    });

    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
    });
    const matching = list.json().taskIds.filter((id: string) => id === task.id);
    expect(matching).toHaveLength(1);
  });

  it('favorite state is task-specific and survives navigating between tasks (Task A favorite, Task B not, back to A still favorite)', async () => {
    const taskA = await taskByNumber(1);
    const taskB = await taskByNumber(2);
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
      payload: { taskId: taskA.id },
    });

    const list = await app.inject({
      method: 'GET',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': anonId },
    });
    const taskIds: string[] = list.json().taskIds;
    expect(taskIds).toContain(taskA.id);
    expect(taskIds).not.toContain(taskB.id);
  });

  it('never mixes favorites between two different users', async () => {
    const task = await taskByNumber(3);
    const userOne = randomUUID();
    const userTwo = randomUUID();

    await app.inject({
      method: 'POST',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': userOne },
      payload: { taskId: task.id },
    });

    const userTwoList = await app.inject({
      method: 'GET',
      url: '/api/v1/favorites',
      headers: { 'x-anon-id': userTwo },
    });
    expect(userTwoList.json().taskIds).not.toContain(task.id);
  });
});
