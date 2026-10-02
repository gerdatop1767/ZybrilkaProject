import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import * as service from './service.js';

export interface LearningRoutesOptions {
  db: Database;
}

export const learningRoutes: FastifyPluginAsync<LearningRoutesOptions> = async (app, { db }) => {
  app.get('/me/learning/mastery', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const items = await service.getUserMastery(db, request.userId);
    return { items };
  });
};
