import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { saveLearningProfileRequestSchema } from '@zybrilka/shared';
import { inArray } from 'drizzle-orm';
import type { FastifyPluginAsync } from 'fastify';
import * as service from './service.js';

export interface LearningProfileRoutesOptions {
  db: Database;
}

export const learningProfileRoutes: FastifyPluginAsync<LearningProfileRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/me/learning-profile', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    return service.getLearningProfile(db, request.userId);
  });

  app.put('/me/learning-profile', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const body = saveLearningProfileRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'invalid_body', issues: body.error.issues });
    }

    const subjectIds = body.data.subjects.map((s) => s.subjectId);
    const existing = await db
      .select({ id: schema.subjects.id })
      .from(schema.subjects)
      .where(inArray(schema.subjects.id, subjectIds));
    const existingIds = new Set(existing.map((row) => row.id));
    const unknownSubjectIds = subjectIds.filter((id) => !existingIds.has(id));
    if (unknownSubjectIds.length > 0) {
      return reply.code(400).send({ error: 'unknown_subject', subjectIds: unknownSubjectIds });
    }

    return service.saveLearningProfile(db, request.userId, body.data);
  });
};
