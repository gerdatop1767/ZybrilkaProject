import { getRandomTask } from './api.js';
import type { Route } from './navigation.js';

/**
 * The only way a `{ screen: 'task' }` route should ever be reached:
 * fetches a real published task from the API and navigates to its
 * actual UUID. `GET /api/v1/tasks/:id` requires a UUID, so navigating
 * straight to a design-mock id (e.g. the demo task's non-UUID id)
 * always fails with `400 invalid_id` and shows "Не удалось загрузить
 * задание."
 *
 * `collection` scopes the pick to that collection's tasks (via
 * `GET /tasks/random?collection=`) and is carried into the resulting
 * `task` route's `collectionSlug` so the selected source isn't lost
 * once the caller's own component unmounts — see navigation.tsx.
 */
export function startRealTask(
  navigate: (route: Route) => void,
  params: { subject?: string; taskNumber?: number; collection?: string } = {},
): void {
  void getRandomTask(params).then((task) => {
    navigate({
      screen: 'task',
      subjectId: task.subjectId,
      taskNumber: task.taskNumber,
      taskId: task.id,
      collectionSlug: params.collection,
    });
  });
}
