import type { Database } from '@zybrilka/db';
import type { FastifyPluginAsync } from 'fastify';
import * as service from './service.js';

export interface CollectionsRoutesOptions {
  db: Database;
}

export const collectionsRoutes: FastifyPluginAsync<CollectionsRoutesOptions> = async (
  app,
  { db },
) => {
  app.get('/collections', async () => service.listCollections(db));
};
