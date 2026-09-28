import type { Database } from '@zybrilka/db';
import {
  progressByTaskNumberQuerySchema,
  progressByTopicQuerySchema,
  progressDailyQuerySchema,
} from '@zybrilka/shared';
import type { FastifyPluginAsync } from 'fastify';
import * as service from './service.js';

const DEFAULT_DAILY_DAYS = 30;

export interface ProgressRoutesOptions {
  db: Database;
}

export const progressRoutes: FastifyPluginAsync<ProgressRoutesOptions> = async (app, { db }) => {
  app.get('/progress/summary', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    return service.getSummary(db, request.userId);
  });

  // Real per-task-number coverage (X/Y on the "По номерам" screen) —
  // see apps/api/src/modules/progress/repo.ts for how total/completed
  // are computed. Registered before any parameterized route would be
  // needed here; there isn't one on this plugin, but kept consistent
  // with the tasksRoutes ordering convention regardless.
  app.get('/progress/by-task-number', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const query = progressByTaskNumberQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }
    return service.getByTaskNumberWithTotals(db, request.userId, query.data);
  });

  // Real per-topic coverage (X/Y on "Темы") — same total/completed
  // contract and source-isolation rules as /progress/by-task-number,
  // grouped by the real `topics` table instead of task number.
  app.get('/progress/by-topic', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const query = progressByTopicQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }
    return service.getByTopicWithTotals(db, request.userId, query.data);
  });

  // Real per-day activity for the "Активность по дням" chart — see
  // apps/api/src/modules/progress/repo.ts's getDaily for the UTC-day
  // bucketing and distinct-task dedup rules.
  app.get('/progress/daily', async (request, reply) => {
    if (!request.userId) {
      return reply.code(400).send({ error: 'missing_anon_id' });
    }
    const query = progressDailyQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }
    return service.getDaily(db, request.userId, query.data.days ?? DEFAULT_DAILY_DAYS);
  });
};
