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
/**
 * Subject → Варианты → "Собери собственный вариант": resolves every
 * picked task number to a real task (in parallel, `collection`
 * unrestricted means "Общий банк" — same single-task pick every other
 * unrestricted fetch in this app already uses) and navigates straight
 * into the first one carrying the *whole* resolved list as
 * `customOrderedTasks` (navigation.tsx) — this is what makes the
 * number strip show exactly the picked numbers and prev/next follow
 * them, instead of collapsing to just the first number with no
 * ordered context at all (Task Workspace block — the reported
 * "Варианты → Общие → сформировать вариант" bug).
 */
export function startCustomVariant(
  navigate: (route: Route) => void,
  params: {
    subject: string;
    taskNumbers: readonly number[];
    collection?: string;
    returnTo?: Route;
  },
): void {
  if (params.taskNumbers.length === 0) return;
  void Promise.all(
    params.taskNumbers.map((taskNumber) =>
      getRandomTask({ subject: params.subject, taskNumber, collection: params.collection }),
    ),
  ).then((tasks) => {
    const first = tasks[0]!;
    navigate({
      screen: 'task',
      subjectId: first.subjectId,
      taskNumber: first.taskNumber,
      taskId: first.id,
      collectionSlug: params.collection,
      customOrderedTasks: tasks.map((t) => ({ taskId: t.id, taskNumber: t.taskNumber })),
      returnTo: params.returnTo,
    });
  });
}

export function startRealTask(
  navigate: (route: Route) => void,
  params: {
    subject?: string;
    taskNumber?: number;
    collection?: string;
    topic?: string;
    /** Where Task's back arrow should return to (audit Block 3) — see
     * `returnTo` on the `task` route in navigation.tsx. Absent means
     * "no known parent overlay", same as before this existed. */
    returnTo?: Route;
  } = {},
): void {
  void getRandomTask(params).then((task) => {
    navigate({
      screen: 'task',
      subjectId: task.subjectId,
      taskNumber: task.taskNumber,
      taskId: task.id,
      collectionSlug: params.collection,
      returnTo: params.returnTo,
    });
  });
}
