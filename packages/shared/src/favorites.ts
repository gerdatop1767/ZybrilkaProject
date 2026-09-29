import { z } from 'zod';

/** All of a user's favorited task ids — enough for the client to
 * answer "is this task favorited?" for any task it might show without
 * a separate round trip per task. */
export const favoritesListResponseSchema = z.object({
  taskIds: z.array(z.uuid()),
});
export type FavoritesListResponse = z.infer<typeof favoritesListResponseSchema>;

export const favoriteRequestSchema = z.object({
  taskId: z.uuid(),
});
export type FavoriteRequest = z.infer<typeof favoriteRequestSchema>;
