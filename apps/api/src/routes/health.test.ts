import { healthResponseSchema } from '@zybrilka/shared';
import { pingDb } from '@zybrilka/db';
import { createTestDb } from '@zybrilka/db/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

describe('GET /health', () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('reports ok when the database is reachable', async () => {
    const app = buildApp({ version: 'test', checkDb: () => pingDb(testDb.db) });
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    const body = healthResponseSchema.parse(res.json());
    expect(body).toMatchObject({ status: 'ok', version: 'test', db: 'ok' });
    await app.close();
  });

  it('reports not_configured without a database', async () => {
    const app = buildApp({ version: 'test' });
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', db: 'not_configured' });
    await app.close();
  });

  it('returns 503 when the database is down', async () => {
    const app = buildApp({
      version: 'test',
      checkDb: () => Promise.reject(new Error('connection refused')),
    });
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'degraded', db: 'down' });
    await app.close();
  });
});
