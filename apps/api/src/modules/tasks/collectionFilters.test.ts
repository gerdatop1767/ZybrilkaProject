import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * S3.2 — collection/variant filters on the existing public task
 * endpoints. The real EGE-2026 Вариант 1 import already creates one
 * "ЕГЭ 2026 Ященко" collection + one Variant 1 (see
 * importEge2026Variant1.ts), so these tests exercise the filters
 * against real, not ad-hoc, data.
 */
describe('collection/variant filters on /tasks and /tasks/random', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it("GET /tasks?collection=... returns only that collection's tasks", async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks?collection=ege-2026-yashchenko&limit=100',
    });
    const body = res.json();
    expect(body.items).toHaveLength(19);
    expect(body.items.every((t: { source: string }) => t.source.includes('Ященко'))).toBe(true);
  });

  it('GET /tasks?collection=...&taskNumber=... narrows to one task', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks?collection=ege-2026-yashchenko&taskNumber=5',
    });
    const body = res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].taskNumber).toBe(5);
  });

  it('GET /tasks?collection=<unknown slug> returns an empty list, not an error', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks?collection=does-not-exist',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(0);
  });

  it("GET /tasks?variant=<id> returns only that variant's tasks", async () => {
    const [variant] = await testDb.db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.variantNumber, 1));
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks?variant=${variant!.id}&limit=100`,
    });
    expect(res.json().items).toHaveLength(19);
  });

  it('GET /tasks/random?collection=...&taskNumber=... picks from that collection only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/random?collection=ege-2026-yashchenko&taskNumber=8',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().taskNumber).toBe(8);
  });

  it('excludes tasks whose variant is not published, even if the task itself is', async () => {
    const [collection] = await testDb.db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.slug, 'ege-2026-yashchenko'));
    const [draftVariant] = await testDb.db
      .insert(schema.variants)
      .values({
        collectionId: collection!.id,
        variantNumber: 999,
        title: 'Draft variant',
        status: 'draft',
      })
      .returning();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 1));
    await testDb.db
      .insert(schema.variantTasks)
      .values({ variantId: draftVariant!.id, taskId: task!.id, position: 1 });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks?variant=${draftVariant!.id}`,
    });
    expect(res.json().items).toHaveLength(0);
  });
});
