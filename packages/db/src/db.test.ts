import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pingDb } from './client.js';
import * as schema from './schema.js';
import { createTestDb } from './testing.js';

describe('database', () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('answers a ping', async () => {
    await expect(pingDb(testDb.db)).resolves.toBeUndefined();
  });

  it('stores and reads app settings', async () => {
    const { db } = testDb;
    await db.insert(schema.appSettings).values({ key: 'maintenance', value: { enabled: false } });
    const [row] = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, 'maintenance'));
    expect(row?.value).toEqual({ enabled: false });
    expect(row?.updatedAt).toBeInstanceOf(Date);
  });
});
