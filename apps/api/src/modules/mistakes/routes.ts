import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import * as service from './service.js';

export interface MistakesRoutesOptions {
  db: Database;
}

export const mistakesRoutes: FastifyPluginAsync<MistakesRoutesOptions> = async (app, { db }) => {
  app.get('/mistakes', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const items = await service.listMistakes(db, request.userId);
    return { items };
  });
};
