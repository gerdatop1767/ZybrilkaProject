import type { Database } from '@zybrilka/db';
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
};
