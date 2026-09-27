import type { Database } from '@zybrilka/db';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { registerAnonUser } from './plugins/anonUser.js';
import { collectionsRoutes } from './modules/collections/routes.js';
import { mistakesRoutes } from './modules/mistakes/routes.js';
import { progressRoutes } from './modules/progress/routes.js';
import { tasksRoutes } from './modules/tasks/routes.js';
import { variantsRoutes } from './modules/variants/routes.js';

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  version: string;
  /** Resolves when the database is reachable. Omitted when no database is configured. */
  checkDb?: () => Promise<void>;
  /** Task-engine routes (tasks/mistakes/progress) only register when a database is given. */
  db?: Database;
}

export function buildApp({ logger = false, version, checkDb, db }: AppOptions) {
  const app = Fastify({ logger });
  app.register(healthRoutes, { version, checkDb });

  if (db) {
    void registerAnonUser(app, db);
    app.register(tasksRoutes, { db, prefix: '/api/v1' });
    app.register(variantsRoutes, { db, prefix: '/api/v1' });
    app.register(collectionsRoutes, { db, prefix: '/api/v1' });
    app.register(mistakesRoutes, { db, prefix: '/api/v1' });
    app.register(progressRoutes, { db, prefix: '/api/v1' });
  }

  return app;
}
