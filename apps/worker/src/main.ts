import { createDb, pingDb } from '@zybrilka/db';
import { pino } from 'pino';
import { loadConfig } from './config.js';
import { startWorker } from './worker.js';

const config = loadConfig();
const logger = pino({ level: config.LOG_LEVEL });
const database = config.DATABASE_URL ? createDb(config.DATABASE_URL) : undefined;

try {
  const worker = await startWorker({
    logger,
    checkDb: database ? () => pingDb(database.db) : undefined,
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    await worker.stop();
    await database?.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
} catch (error) {
  logger.fatal(error);
  await database?.close();
  process.exit(1);
}
