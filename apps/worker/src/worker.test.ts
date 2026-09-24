import { pino } from 'pino';
import { describe, expect, it } from 'vitest';
import { startWorker } from './worker.js';

const logger = pino({ enabled: false });

describe('startWorker', () => {
  it('starts and stops with a reachable database', async () => {
    const worker = await startWorker({ logger, checkDb: () => Promise.resolve() });
    await expect(worker.stop()).resolves.toBeUndefined();
  });

  it('starts without a database', async () => {
    const worker = await startWorker({ logger });
    await worker.stop();
  });

  it('fails to start when the database is unreachable', async () => {
    await expect(
      startWorker({ logger, checkDb: () => Promise.reject(new Error('connection refused')) }),
    ).rejects.toThrow('connection refused');
  });
});
