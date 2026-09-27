import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as service from './service.js';

export interface VariantsRoutesOptions {
  db: Database;
}

const variantIdParamsSchema = z.object({ id: z.uuid() });

export const variantsRoutes: FastifyPluginAsync<VariantsRoutesOptions> = async (app, { db }) => {
  app.get('/variants/:id', async (request, reply) => {
    const params = variantIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const detail = await service.getVariantDetail(db, params.data.id);
    if (!detail) return reply.code(404).send({ error: 'variant_not_found' });
    return detail;
  });
};
