import type {
  AttemptRequest,
  AttemptResult,
  Mistake,
  ProgressSummary,
  TaskPublic,
  TaskWithSolution,
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
}): Promise<TaskPublic> {
  const query = new URLSearchParams();
  if (params.subject) query.set('subject', params.subject);
  if (params.taskNumber) query.set('taskNumber', String(params.taskNumber));
  const qs = query.toString();
  return apiFetch(`/tasks/random${qs ? `?${qs}` : ''}`);
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
