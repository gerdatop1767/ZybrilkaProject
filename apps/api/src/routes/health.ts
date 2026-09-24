import type { HealthResponse } from '@zybrilka/shared';
import type { FastifyPluginAsync } from 'fastify';

const DB_CHECK_TIMEOUT_MS = 2000;

interface HealthOptions {
  version: string;
  checkDb?: () => Promise<void>;
}

export const healthRoutes: FastifyPluginAsync<HealthOptions> = async (
  app,
  { version, checkDb },
) => {
  app.get('/health', async (request, reply) => {
    let db: HealthResponse['db'] = 'not_configured';
    if (checkDb) {
      try {
        await withTimeout(checkDb(), DB_CHECK_TIMEOUT_MS);
        db = 'ok';
      } catch (error) {
        request.log.error({ err: error }, 'database health check failed');
        db = 'down';
      }
    }

    const body: HealthResponse = {
      status: db === 'down' ? 'degraded' : 'ok',
      version,
      uptimeSeconds: Math.round(process.uptime()),
      db,
    };
    return reply
      .code(db === 'down' ? 503 : 200)
      .header('cache-control', 'no-store')
      .send(body);
  });
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
