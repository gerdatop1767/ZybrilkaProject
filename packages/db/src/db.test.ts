import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pingDb } from './client.js';
import { migrationsFolder } from './migrate.js';
import * as schema from './schema.js';

describe('database', () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder });
  });

  afterAll(async () => {
    await client.close();
  });

  it('answers a ping', async () => {
    await expect(pingDb(db)).resolves.toBeUndefined();
  });

  it('stores and reads app settings', async () => {
    await db.insert(schema.appSettings).values({ key: 'maintenance', value: { enabled: false } });
    const [row] = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, 'maintenance'));
    expect(row?.value).toEqual({ enabled: false });
    expect(row?.updatedAt).toBeInstanceOf(Date);
  });
});
