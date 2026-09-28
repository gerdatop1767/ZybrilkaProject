import type { Database } from '@zybrilka/db';
import { progressByTaskNumberQuerySchema } from '@zybrilka/shared';
import type { FastifyPluginAsync } from 'fastify';
import * as service from './service.js';

export interface ProgressRoutesOptions {
  db: Database;
}

export const progressRoutes: FastifyPluginAsync<ProgressRoutesOptions> = async (app, { db }) => {
  app.get('/progress/summary', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    return service.getSummary(db, request.userId);
  });

  // Real per-task-number coverage (X/Y on the "По номерам" screen) —
  // see apps/api/src/modules/progress/repo.ts for how total/completed
  // are computed. Registered before any parameterized route would be
  // needed here; there isn't one on this plugin, but kept consistent
  // with the tasksRoutes ordering convention regardless.
  app.get('/progress/by-task-number', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const query = progressByTaskNumberQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }
    return service.getByTaskNumberWithTotals(db, request.userId, query.data);
  });
};
