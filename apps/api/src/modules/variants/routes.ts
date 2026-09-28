import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as service from './service.js';

export interface VariantsRoutesOptions {
  db: Database;
}

const variantIdParamsSchema = z.object({ id: z.uuid() });
const taskIdParamsSchema = z.object({ taskId: z.uuid() });
const forTaskQuerySchema = z.object({ collection: z.string().optional() });

export const variantsRoutes: FastifyPluginAsync<VariantsRoutesOptions> = async (app, { db }) => {
  // Registered before "/variants/:id" so this static-segment path is
  // never swallowed by the param route, matching tasksRoutes' own
  // "/tasks/random" before "/tasks/:id" convention.
  app.get('/variants/for-task/:taskId', async (request, reply) => {
    const params = taskIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });
    const query = forTaskQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }

    const detail = await service.getVariantDetailForTask(
      db,
      params.data.taskId,
      query.data.collection,
    );
    if (!detail) return reply.code(404).send({ error: 'variant_not_found' });
    return detail;
  });

  app.get('/variants/:id', async (request, reply) => {
    const params = variantIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const detail = await service.getVariantDetail(db, params.data.id);
    if (!detail) return reply.code(404).send({ error: 'variant_not_found' });
    return detail;
  });
};
