import type { Database } from '@zybrilka/db';
import { favoriteRequestSchema } from '@zybrilka/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getTaskById } from '../tasks/repo.js';
import * as service from './service.js';

export interface FavoritesRoutesOptions {
  db: Database;
}

const taskIdParamsSchema = z.object({ taskId: z.uuid() });

export const favoritesRoutes: FastifyPluginAsync<FavoritesRoutesOptions> = async (app, { db }) => {
  app.get('/favorites', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    return service.listFavorites(db, request.userId);
  });

  app.post('/favorites', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const body = favoriteRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: body.error.issues });
    }
    const task = await getTaskById(db, body.data.taskId);
    if (!task) return reply.code(404).send({ error: 'task_not_found' });

    await service.addFavorite(db, request.userId, body.data.taskId);
    return reply.code(204).send();
  });

  app.delete('/favorites/:taskId', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const params = taskIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    await service.removeFavorite(db, request.userId, params.data.taskId);
    return reply.code(204).send();
  });
};
