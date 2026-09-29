import type { Database } from '@zybrilka/db';
import type { FavoritesListResponse } from '@zybrilka/shared';
import * as repo from './repo.js';

export async function listFavorites(db: Database, userId: string): Promise<FavoritesListResponse> {
  const taskIds = await repo.listFavoriteTaskIds(db, userId);
  return { taskIds };
}

export async function addFavorite(db: Database, userId: string, taskId: string): Promise<void> {
  await repo.addFavorite(db, userId, taskId);
}

export async function removeFavorite(db: Database, userId: string, taskId: string): Promise<void> {
  await repo.removeFavorite(db, userId, taskId);
}
