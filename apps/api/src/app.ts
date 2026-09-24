import Fastify, { type FastifyServerOptions } from 'fastify';
import { healthRoutes } from './routes/health.js';

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  version: string;
  /** Resolves when the database is reachable. Omitted when no database is configured. */
  checkDb?: () => Promise<void>;
}

export function buildApp({ logger = false, version, checkDb }: AppOptions) {
  const app = Fastify({ logger });
  app.register(healthRoutes, { version, checkDb });
  return app;
}
