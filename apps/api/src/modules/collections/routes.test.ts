import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('GET /api/v1/collections', () => {
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

  it('lists the real imported collection with its variant nested', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/collections' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const yashchenko = body.items.find(
      (item: { collection: { slug: string } }) => item.collection.slug === 'ege-2026-yashchenko',
    );
    expect(yashchenko).toBeDefined();
    expect(yashchenko.collection.title).toBe('ЕГЭ 2026 Ященко');
    expect(yashchenko.variants).toHaveLength(1);
    expect(yashchenko.variants[0].variantNumber).toBe(1);
  });

  it('excludes a draft collection', async () => {
    await testDb.db
      .insert(schema.collections)
      .values({ subjectId: 'math', slug: 'draft-collection', title: 'Draft', status: 'draft' });

    const res = await app.inject({ method: 'GET', url: '/api/v1/collections' });
    const body = res.json();
    expect(
      body.items.some(
        (item: { collection: { slug: string } }) => item.collection.slug === 'draft-collection',
      ),
    ).toBe(false);
  });

  it('excludes a draft variant from an otherwise published collection', async () => {
    const [collection] = await testDb.db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.slug, 'ege-2026-yashchenko'));
    await testDb.db.insert(schema.variants).values({
      collectionId: collection!.id,
      variantNumber: 997,
      title: 'Draft variant',
      status: 'draft',
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/collections' });
    const body = res.json();
    const yashchenko = body.items.find(
      (item: { collection: { slug: string } }) => item.collection.slug === 'ege-2026-yashchenko',
    );
    expect(
      yashchenko.variants.every((v: { variantNumber: number }) => v.variantNumber !== 997),
    ).toBe(true);
  });
});
