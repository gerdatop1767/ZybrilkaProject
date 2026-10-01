import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLearningPath } from './service.js';

export interface LearningPathRoutesOptions {
  db: Database;
}

const DEFAULT_LIMIT = 5;
const MIN_LIMIT = 1;
const MAX_LIMIT = 10;

const learningPathQuerySchema = z.object({
  subjectId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(MIN_LIMIT).max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
});

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 8. Per-user, like Phase 7's
 * `/me/learning/next-task` — the sequence depends entirely on this
 * user's own mastery, errors and history.
 */
export const learningPathRoutes: FastifyPluginAsync<LearningPathRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/me/learning/path', async (request, reply) => {
    if (!request.userId) return reply.code(400).send({ error: 'missing_anon_id' });

    const query = learningPathQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }

    return getLearningPath(db, request.userId, {
      subjectId: query.data.subjectId,
      limit: query.data.limit,
    });
  });
};
