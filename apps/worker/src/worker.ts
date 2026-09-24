import type { Logger } from 'pino';

export interface WorkerOptions {
  logger: Logger;
  /** Resolves when the database is reachable. Omitted when no database is configured. */
  checkDb?: () => Promise<void>;
}

export interface Worker {
  stop: () => Promise<void>;
}

// Background jobs (imports, analytics rollups, bots) are registered here in later stages.
export async function startWorker({ logger, checkDb }: WorkerOptions): Promise<Worker> {
  if (checkDb) {
    await checkDb();
    logger.info('database reachable');
  } else {
    logger.warn('DATABASE_URL not set; running without a database');
  }

  // Keeps the process alive until jobs exist to do so.
  const heartbeat = setInterval(() => logger.debug('worker heartbeat'), 60_000);
  logger.info('worker started');

  return {
    stop: async () => {
      clearInterval(heartbeat);
      logger.info('worker stopped');
    },
  };
}
