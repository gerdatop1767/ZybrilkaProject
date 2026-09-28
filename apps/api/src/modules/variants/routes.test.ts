import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * S3.2 — GET /api/v1/variants/:id: the full ordered exam view for a
 * real imported variant (Вариант 1), plus the published-only gate
 * (§19) enforced server-side for a variant/collection that isn't.
 */
describe('GET /api/v1/variants/:id', () => {
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

  it('returns the collection, variant, and all 19 tasks in exam order (position 1..19)', async () => {
    const [variant] = await testDb.db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.variantNumber, 1));

    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${variant!.id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.collection.slug).toBe('ege-2026-yashchenko');
    expect(body.variant.variantNumber).toBe(1);
    expect(body.tasks).toHaveLength(19);
    expect(body.tasks.map((t: { position: number }) => t.position)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 1),
    );
    // position N is task number N — the exam's own order.
    for (const item of body.tasks) {
      expect(item.task.taskNumber).toBe(item.position);
    }
  });

  it('never includes correctAnswer/explanationMd — same public shape as GET /tasks', async () => {
    const [variant] = await testDb.db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.variantNumber, 1));
    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${variant!.id}` });
    const body = res.json();
    for (const item of body.tasks) {
      expect(item.task).not.toHaveProperty('correctAnswer');
      expect(item.task).not.toHaveProperty('explanationMd');
    }
  });

  it('carries interval (№15) and multi_part (№19) answerType/answerParts through', async () => {
    const [variant] = await testDb.db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.variantNumber, 1));
    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${variant!.id}` });
    const body = res.json();
    const task15 = body.tasks.find((t: { position: number }) => t.position === 15);
    const task19 = body.tasks.find((t: { position: number }) => t.position === 19);
    expect(task15.task.answerType).toBe('interval');
    expect(task19.task.answerType).toBe('multi_part');
    expect(task19.task.answerParts).toHaveLength(3);
  });

  it('returns 404 for a random unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${randomUUID()}` });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for a non-uuid id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/variants/not-a-uuid' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a draft variant, even with valid membership (published-only enforced server-side)', async () => {
    const [collection] = await testDb.db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.slug, 'ege-2026-yashchenko'));
    const [draftVariant] = await testDb.db
      .insert(schema.variants)
      .values({
        collectionId: collection!.id,
        variantNumber: 998,
        title: 'Draft variant',
        status: 'draft',
      })
      .returning();

    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${draftVariant!.id}` });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for a published variant inside an archived collection', async () => {
    const [archivedCollection] = await testDb.db
      .insert(schema.collections)
      .values({
        subjectId: 'math',
        slug: 'archived-collection',
        title: 'Archived',
        status: 'archived',
      })
      .returning();
    const [variant] = await testDb.db
      .insert(schema.variants)
      .values({
        collectionId: archivedCollection!.id,
        variantNumber: 1,
        title: 'V1',
        status: 'published',
      })
      .returning();

    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${variant!.id}` });
    expect(res.statusCode).toBe(404);
  });

  it('excludes a task that is no longer published from the ordered list', async () => {
    const [collection] = await testDb.db
      .insert(schema.collections)
      .values({ subjectId: 'math', slug: 'partial-variant', title: 'Partial' })
      .returning();
    const [variant] = await testDb.db
      .insert(schema.variants)
      .values({ collectionId: collection!.id, variantNumber: 1, title: 'V1' })
      .returning();
    const [publishedTask] = await testDb.db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 501,
        difficulty: 1,
        conditionMd: 'A',
        correctAnswer: '1',
        explanationMd: 'A.',
        source: 'demo',
        status: 'published',
      })
      .returning();
    const [draftTask] = await testDb.db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 502,
        difficulty: 1,
        conditionMd: 'B',
        correctAnswer: '2',
        explanationMd: 'B.',
        source: 'demo',
        status: 'draft',
      })
      .returning();
    await testDb.db.insert(schema.variantTasks).values([
      { variantId: variant!.id, taskId: publishedTask!.id, position: 1 },
      { variantId: variant!.id, taskId: draftTask!.id, position: 2 },
    ]);

    const res = await app.inject({ method: 'GET', url: `/api/v1/variants/${variant!.id}` });
    const body = res.json();
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].task.taskNumber).toBe(501);
  });
});

describe('GET /api/v1/variants/for-task/:taskId', () => {
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

  it("resolves task 7's variant and returns the same 19-task ordered exam", async () => {
    const [task7] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.taskNumber, 7),
          eq(schema.tasks.source, 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты'),
        ),
      );

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/variants/for-task/${task7!.id}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.collection.slug).toBe('ege-2026-yashchenko');
    expect(body.tasks).toHaveLength(19);
  });

  it('scoping by collection slug still resolves the correct variant', async () => {
    const [task7] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.taskNumber, 7),
          eq(schema.tasks.source, 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты'),
        ),
      );

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/variants/for-task/${task7!.id}?collection=ege-2026-yashchenko`,
    });
    expect(res.statusCode).toBe(200);
  });

  it('a collection slug that does not contain this task returns 404 (no cross-source leak)', async () => {
    const [task7] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.taskNumber, 7),
          eq(schema.tasks.source, 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты'),
        ),
      );

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/variants/for-task/${task7!.id}?collection=does-not-exist`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('a task that is not part of any variant (a demo-seed task) returns 404', async () => {
    const [seedTask] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.source, 'Zybrilka demo (не ФИПИ)'));

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/variants/for-task/${seedTask!.id}`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for a random unknown task id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/variants/for-task/${randomUUID()}`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for a non-uuid task id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/variants/for-task/not-a-uuid' });
    expect(res.statusCode).toBe(400);
  });
});
