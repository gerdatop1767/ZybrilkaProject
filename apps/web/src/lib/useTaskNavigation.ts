import { useEffect, useState } from 'react';
import { getVariant, getVariantForTask } from './api.js';
import { useNavigation, type Route } from './navigation.js';

export interface TaskNavigationEntry {
  taskId: string;
  taskNumber: number;
}

export interface TaskNavigationContext {
  /** True while the ordered list is being resolved (or hasn't started
   * because there's no collection/variant context to resolve from). */
  loading: boolean;
  /** The full ordered task list for the current variant, in exam
   * order — real task numbers as they exist, gaps and all (e.g.
   * 11,12,14,17). Empty when no collection/variant context is known,
   * or none could be resolved (task not in any variant, unknown
   * source). */
  orderedTasks: readonly TaskNavigationEntry[];
  /** The previous task in `orderedTasks`, or null at the start of the
   * list (or when there is no list). */
  previous: TaskNavigationEntry | null;
  /** The next task in `orderedTasks`, or null at the end of the list
   * (or when there is no list). */
  next: TaskNavigationEntry | null;
  /** The resolved variant id, once known — carry this forward on any
   * navigation this hook doesn't itself perform, so the next screen
   * doesn't need to re-resolve it from collectionSlug+taskId. */
  variantId: string | null;
  /** Navigates to a specific entry from `orderedTasks`, preserving the
   * current subject/collection/resolved-variant context. */
  goTo: (entry: TaskNavigationEntry) => void;
}

/**
 * The single source of truth for "what comes before/after this task,
 * within its current source" — used identically by TaskDesktop,
 * TaskMobile, ResultDesktop and ResultMobile for the top number strip,
 * the prev/next arrows, and "Следующее задание", so none of them
 * invents its own ordering or drops the source/variant context.
 *
 * Resolution order:
 * 1. `customOrderedTasks` already known (a user-assembled variant from
 *    Subject → Варианты → "Собери собственный вариант" — see
 *    navigation.tsx's `task.customOrderedTasks`) — use it directly, no
 *    fetch: it has no `variants` row of its own to resolve from, and
 *    is already the exact real ordering the user picked (Task
 *    Workspace block — never `taskNumber ± 1`, never the full
 *    canonical 1..19 when the user picked a subset).
 * 2. `variantId` already known (e.g. picked explicitly in Training's
 *    "Вариант" mode) — fetch that variant directly, no guessing.
 * 3. Only `collectionSlug` known — resolve which variant this task
 *    belongs to *within that collection* (GET /variants/for-task),
 *    so a different source's task with the same number never leaks
 *    in (source isolation) and a different variant's copy never does
 *    either (variant isolation).
 * 4. None known (e.g. reached via "Темы", or a cross-source sibling
 *    from "Другие задания") — no ordered list. `previous`/`next` stay
 *    null and `orderedTasks` stays empty; callers render a single-item
 *    context (just the current number, no strip/arrows) rather than
 *    inventing an ordering that doesn't exist.
 */
export function useTaskNavigation(params: {
  subjectId: string;
  taskId: string;
  collectionSlug?: string;
  variantId?: string;
  customOrderedTasks?: readonly TaskNavigationEntry[];
  /** Carried onto every `goTo()` navigation (Prev/Next/Skip/number
   * strip), so the back-arrow return context set on the current task
   * (audit Block 3) survives moving to a sibling task instead of
   * resetting on every step. */
  returnTo?: Route;
}): TaskNavigationContext {
  const { subjectId, taskId, collectionSlug, variantId, customOrderedTasks, returnTo } = params;
  const { navigate } = useNavigation();
  const hasCustomList = Boolean(customOrderedTasks && customOrderedTasks.length > 0);
  const hasContext = !hasCustomList && Boolean(collectionSlug || variantId);
  // Identifies "which request this is for" — resolution depends on all
  // three, so any of them changing means the previous fetch's result
  // (if it lands late) must not be applied. Compared against on render
  // rather than reset via effect+setState, so a stale result never
  // renders even for one frame.
  const requestKey = `${taskId}|${collectionSlug ?? ''}|${variantId ?? ''}`;

  const [fetched, setFetched] = useState<{
    key: string;
    orderedTasks: readonly TaskNavigationEntry[];
    resolvedVariantId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!hasContext) return;

    let cancelled = false;
    const key = `${taskId}|${collectionSlug ?? ''}|${variantId ?? ''}`;
    const request = variantId ? getVariant(variantId) : getVariantForTask(taskId, collectionSlug);

    void request
      .then((detail) => {
        if (cancelled) return;
        setFetched({
          key,
          orderedTasks: detail.tasks
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((t) => ({ taskId: t.task.id, taskNumber: t.task.taskNumber })),
          resolvedVariantId: detail.variant.id,
        });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key, orderedTasks: [], resolvedVariantId: null });
      });

    return () => {
      cancelled = true;
    };
  }, [taskId, collectionSlug, variantId, hasContext]);

  const resolved = hasContext && fetched && fetched.key === requestKey ? fetched : null;
  const loading = hasContext && resolved === null;
  const orderedTasks = hasCustomList ? customOrderedTasks! : (resolved?.orderedTasks ?? []);
  const resolvedVariantId = hasCustomList ? null : (resolved?.resolvedVariantId ?? null);

  const currentIndex = orderedTasks.findIndex((t) => t.taskId === taskId);
  const previous = currentIndex > 0 ? (orderedTasks[currentIndex - 1] ?? null) : null;
  const next =
    currentIndex >= 0 && currentIndex < orderedTasks.length - 1
      ? (orderedTasks[currentIndex + 1] ?? null)
      : null;

  function goTo(entry: TaskNavigationEntry) {
    navigate({
      screen: 'task',
      subjectId,
      taskNumber: entry.taskNumber,
      taskId: entry.taskId,
      collectionSlug,
      variantId: resolvedVariantId ?? undefined,
      customOrderedTasks,
      returnTo,
    });
  }

  return {
    loading,
    orderedTasks,
    previous,
    next,
    variantId: resolvedVariantId,
    goTo,
  };
}
