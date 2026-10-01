import type { Database } from '@zybrilka/db';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { registerAnonUser } from './plugins/anonUser.js';
import { collectionsRoutes } from './modules/collections/routes.js';
import { favoritesRoutes } from './modules/favorites/routes.js';
import { learningRoutes } from './modules/learning/routes.js';
import { learningProfileRoutes } from './modules/learningProfile/routes.js';
import { taskStatisticsRoutes } from './modules/learning/taskStatistics/routes.js';
import { errorSignaturesRoutes } from './modules/learning/errorSignatures/routes.js';
import { taskSimilarityRoutes } from './modules/learning/taskSimilarity/routes.js';
import { recommendationRoutes } from './modules/learning/recommendation/routes.js';
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
    app.register(favoritesRoutes, { db, prefix: '/api/v1' });
    app.register(learningProfileRoutes, { db, prefix: '/api/v1' });
    app.register(learningRoutes, { db, prefix: '/api/v1' });
    app.register(taskStatisticsRoutes, { db, prefix: '/api/v1' });
    app.register(errorSignaturesRoutes, { db, prefix: '/api/v1' });
    app.register(taskSimilarityRoutes, { db, prefix: '/api/v1' });
    app.register(recommendationRoutes, { db, prefix: '/api/v1' });
  }

  return app;
}
