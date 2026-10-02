import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { getUserErrorStatistics } from './service.js';

export interface ErrorSignaturesRoutesOptions {
  db: Database;
}

export const errorSignaturesRoutes: FastifyPluginAsync<ErrorSignaturesRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/me/learning/errors', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const items = await getUserErrorStatistics(db, request.userId);
    return { items };
  });
};
