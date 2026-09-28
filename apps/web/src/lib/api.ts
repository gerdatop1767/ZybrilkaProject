import type {
  AttemptRequest,
  AttemptResult,
  CollectionListItem,
  Mistake,
  ProgressByTaskNumberResponse,
  ProgressByTopicResponse,
  ProgressDailyResponse,
  ProgressSummary,
  TaskPublic,
  TaskWithSolution,
  VariantDetail,
} from '@zybrilka/shared';

const ANON_ID_STORAGE_KEY = 'zybrilka_anon_id';

/**
 * Stable per-browser identity until real auth (S3) exists — generated
 * once, kept in localStorage, sent as `x-anon-id` on every API call so
 * the server can attribute attempts/mistakes/progress to "this
 * browser" without a login. See apps/api/src/plugins/anonUser.ts.
 */
export function getAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_ID_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(ANON_ID_STORAGE_KEY, created);
    return created;
  } catch {
    // Private browsing / storage blocked — still usable within this
    // page load, just not persisted across visits.
    return crypto.randomUUID();
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API request failed with status ${status}`);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // An absolute URL (resolved against the current origin) rather than a
  // bare relative path — Node's fetch (used by jsdom in tests) has no
  // document base URI to resolve a relative path against, unlike a real
  // browser. Same-origin request either way, so this doesn't change
  // behavior for the app itself (still goes through vite's /api proxy).
  const url = new URL(`/api/v1${path}`, window.location.origin);
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-anon-id': getAnonId(),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(response.status, body);
  }
  return (await response.json()) as T;
}

export function getTask(id: string): Promise<TaskPublic | TaskWithSolution> {
  return apiFetch(`/tasks/${id}`);
}

export function getRandomTask(params: {
  subject?: string;
  taskNumber?: number;
  /** Collection slug — restricts the random pick to that collection's tasks. */
  collection?: string;
  /** A specific variant's id — restricts the random pick to just that variant. */
  variant?: string;
  /** A specific topic's id — restricts the random pick to that topic. */
  topic?: string;
}): Promise<TaskPublic> {
  const query = new URLSearchParams();
  if (params.subject) query.set('subject', params.subject);
  if (params.taskNumber) query.set('taskNumber', String(params.taskNumber));
  if (params.collection) query.set('collection', params.collection);
  if (params.variant) query.set('variant', params.variant);
  if (params.topic) query.set('topic', params.topic);
  const qs = query.toString();
  return apiFetch(`/tasks/random${qs ? `?${qs}` : ''}`);
}

export function listCollections(): Promise<CollectionListItem[]> {
  return apiFetch<{ items: CollectionListItem[] }>('/collections').then((r) => r.items);
}

export function getVariant(id: string): Promise<VariantDetail> {
  return apiFetch(`/variants/${id}`);
}

/**
 * Resolves the (published) variant a task belongs to — the ordered
 * exam context used for top-strip navigation, prev/next, and Result's
 * "Следующее задание", when only a taskId is known (not yet an
 * explicit variantId). `collection` isolates the resolution to one
 * source; throws (via ApiError, 404) when the task isn't part of any
 * matching variant.
 */
export function getVariantForTask(taskId: string, collection?: string): Promise<VariantDetail> {
  const qs = collection ? `?collection=${encodeURIComponent(collection)}` : '';
  return apiFetch(`/variants/for-task/${taskId}${qs}`);
}

export function listTasksByNumber(subject: string, taskNumber: number): Promise<TaskPublic[]> {
  return apiFetch<{ items: TaskPublic[] }>(
    `/tasks?subject=${encodeURIComponent(subject)}&taskNumber=${taskNumber}`,
  ).then((r) => r.items);
}

export function submitAttempt(taskId: string, request: AttemptRequest): Promise<AttemptResult> {
  return apiFetch(`/tasks/${taskId}/attempt`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getMistakes(): Promise<Mistake[]> {
  return apiFetch<{ items: Mistake[] }>('/mistakes').then((r) => r.items);
}

export function getProgressSummary(): Promise<ProgressSummary> {
  return apiFetch('/progress/summary');
}

/**
 * Real X/Y for the "По номерам" grid — `total` real, unique published
 * tasks per number under the given filters, `completed` real, unique
 * tasks the current user has attempted. No `collection`/`variant`
 * means the aggregate bank across every source; passing one scopes to
 * just that source, exactly like `getRandomTask`.
 */
export function getProgressByTaskNumber(params: {
  subject?: string;
  collection?: string;
  variant?: string;
}): Promise<ProgressByTaskNumberResponse> {
  const query = new URLSearchParams();
  if (params.subject) query.set('subject', params.subject);
  if (params.collection) query.set('collection', params.collection);
  if (params.variant) query.set('variant', params.variant);
  const qs = query.toString();
  return apiFetch(`/progress/by-task-number${qs ? `?${qs}` : ''}`);
}

/**
 * Real X/Y per real DB topic (never the static per-subject design
 * content) — same total/completed contract and source scoping as
 * `getProgressByTaskNumber`.
 */
export function getProgressByTopic(params: {
  subject?: string;
  collection?: string;
  variant?: string;
}): Promise<ProgressByTopicResponse> {
  const query = new URLSearchParams();
  if (params.subject) query.set('subject', params.subject);
  if (params.collection) query.set('collection', params.collection);
  if (params.variant) query.set('variant', params.variant);
  const qs = query.toString();
  return apiFetch(`/progress/by-topic${qs ? `?${qs}` : ''}`);
}

/**
 * Real per-day activity for the "Активность по дням" chart — see
 * apps/api/src/modules/progress/repo.ts's getDaily for the exact
 * bucketing/dedup rules. Only days with at least one attempt come
 * back; callers zero-fill the requested range themselves.
 */
export function getProgressDaily(params: { days?: number } = {}): Promise<ProgressDailyResponse> {
  const query = new URLSearchParams();
  if (params.days) query.set('days', String(params.days));
  const qs = query.toString();
  return apiFetch(`/progress/daily${qs ? `?${qs}` : ''}`);
}
