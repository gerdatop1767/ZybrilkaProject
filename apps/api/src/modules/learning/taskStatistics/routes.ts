import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getTaskById } from '../../tasks/repo.js';
import { getTaskStatisticsEntry } from './service.js';

export interface TaskStatisticsRoutesOptions {
  db: Database;
}

const taskIdParamsSchema = z.object({ taskId: z.uuid() });

/**
 * Read-only and aggregated across all users (never user-specific —
 * see `calculateTaskDifficulty`), so unlike `/me/learning/mastery`
 * this needs no `request.userId` check: there is no per-user data to
 * leak here.
 */
export const taskStatisticsRoutes: FastifyPluginAsync<TaskStatisticsRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/tasks/:taskId/statistics', async (request, reply) => {
    const params = taskIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const task = await getTaskById(db, params.data.taskId);
    if (!task) return reply.code(404).send({ error: 'task_not_found' });

    return getTaskStatisticsEntry(db, params.data.taskId);
  });
};
