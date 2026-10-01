import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getTaskById } from '../../tasks/repo.js';
import { getSimilarTasks } from './service.js';

export interface TaskSimilarityRoutesOptions {
  db: Database;
}

const taskIdParamsSchema = z.object({ taskId: z.uuid() });
const similarQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
});

/**
 * Read-only and aggregated across all users (metadata similarity, not
 * personal data), so — like `/tasks/:taskId/statistics` — this needs
 * no `request.userId` check.
 */
export const taskSimilarityRoutes: FastifyPluginAsync<TaskSimilarityRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/tasks/:taskId/similar', async (request, reply) => {
    const params = taskIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid_id' });

    const query = similarQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: 'invalid_query', issues: query.error.issues });
    }

    const task = await getTaskById(db, params.data.taskId);
    if (!task) return reply.code(404).send({ error: 'task_not_found' });

    const items = await getSimilarTasks(db, params.data.taskId, query.data.limit);
    return { items };
  });
};
