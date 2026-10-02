import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getNextTaskRecommendation } from './service.js';

export interface RecommendationRoutesOptions {
  db: Database;
}

const nextTaskQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
});

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 7. Per-user (needs
 * `request.userId`, unlike the aggregated Phase 4/6 routes) — the
 * recommendation depends entirely on this user's own mastery, errors
 * and history, so it must never be requestable for another user.
 */
export const recommendationRoutes: FastifyPluginAsync<RecommendationRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/me/learning/next-task', async (request, reply) => {
    if (!request.userId) return reply.code(400).send({ error: 'missing_anon_id' });

    const query = nextTaskQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }

    const recommendation = await getNextTaskRecommendation(db, request.userId, {
      subjectId: query.data.subjectId,
    });
    return { recommendation };
  });
};
