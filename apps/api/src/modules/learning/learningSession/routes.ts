import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { advanceLearningSession, startLearningSession } from './service.js';

export interface LearningSessionRoutesOptions {
  db: Database;
}

const DEFAULT_TOTAL = 5;
const MIN_TOTAL = 1;
const MAX_TOTAL = 10;

const startSessionBodySchema = z.object({
  subjectId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(MIN_TOTAL).max(MAX_TOTAL).optional().default(DEFAULT_TOTAL),
});

const sessionParamsSchema = z.object({ sessionId: z.uuid() });

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 9. Two endpoints only — the
 * smallest surface that supports the real lifecycle (start, then
 * repeatedly advance). A bare `GET /sessions/:id` "peek without
 * advancing" endpoint was deliberately left out: nothing in the
 * described flow needs it, and `start`/`next` already return the full
 * current state every time.
 */
export const learningSessionRoutes: FastifyPluginAsync<LearningSessionRoutesOptions> = async (
  app,
  { db },
) => {
  app.post('/me/learning/sessions', async (request, reply) => {
    if (!request.userId) return reply.code(400).send({ error: 'missing_anon_id' });

    const body = startSessionBodySchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: body.error.issues });
    }

    const session = await startLearningSession(db, request.userId, {
      subjectId: body.data.subjectId,
      total: body.data.limit,
    });
    if (!session) return reply.code(404).send({ error: 'no_candidate_subject' });
    return session;
  });

  app.get('/me/learning/sessions/:sessionId/next', async (request, reply) => {
    if (!request.userId) return reply.code(400).send({ error: 'missing_anon_id' });

    const params = sessionParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const result = await advanceLearningSession(db, request.userId, params.data.sessionId);
    if (!result) return reply.code(404).send({ error: 'session_not_found' });
    return result;
  });
};
