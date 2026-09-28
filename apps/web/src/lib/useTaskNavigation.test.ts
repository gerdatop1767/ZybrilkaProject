import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { useTaskNavigation } from './useTaskNavigation.js';
import { NavigationProvider, useNavigation } from './navigation.js';
import * as api from './api.js';

vi.mock('./api.js', () => ({
  getVariant: vi.fn(),
  getVariantForTask: vi.fn(),
}));

const TASK_A = { taskId: 'task-a', taskNumber: 11 };
const TASK_B = { taskId: 'task-b', taskNumber: 12 };
const TASK_C = { taskId: 'task-c', taskNumber: 14 };
const TASK_D = { taskId: 'task-d', taskNumber: 17 };

function variantDetail(tasks: { taskId: string; taskNumber: number }[]) {
  return {
    variant: {
      id: 'variant-1',
      collectionId: 'col-1',
      variantNumber: 1,
      title: 'Вариант 1',
      year: null,
    },
    collection: {
      id: 'col-1',
      subjectId: 'math',
      slug: 'ege-2026-yashchenko',
      title: 'Ященко',
      publisher: null,
      year: null,
      description: null,
    },
    tasks: tasks.map((t, i) => ({
      position: i + 1,
      task: {
        id: t.taskId,
        subjectId: 'math',
        taskNumber: t.taskNumber,
        topicId: null,
        topicName: null,
        difficulty: 2 as const,
        conditionMd: 'Условие',
        imageUrl: null,
        hintMd: null,
        answerType: 'short_answer' as const,
        answerOptions: null,
        answerParts: null,
        source: 'Ященко',
        sourceUrl: null,
        sourceYear: 2026,
        tags: [],
        status: 'published' as const,
      },
    })),
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(NavigationProvider, null, children);
}

describe('useTaskNavigation', () => {
  it('has no ordered context (loading false, empty list) when neither collectionSlug nor variantId is given', () => {
    const { result } = renderHook(
      () => useTaskNavigation({ subjectId: 'math', taskId: TASK_A.taskId }),
      { wrapper },
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.orderedTasks).toEqual([]);
    expect(result.current.previous).toBeNull();
    expect(result.current.next).toBeNull();
  });

  it('resolves the ordered list via collectionSlug (GET /variants/for-task)', async () => {
    vi.mocked(api.getVariantForTask).mockResolvedValue(
      variantDetail([TASK_A, TASK_B, TASK_C, TASK_D]),
    );
    const { result } = renderHook(
      () =>
        useTaskNavigation({
          subjectId: 'math',
          taskId: TASK_B.taskId,
          collectionSlug: 'ege-2026-yashchenko',
        }),
      { wrapper },
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.getVariantForTask).toHaveBeenCalledWith(TASK_B.taskId, 'ege-2026-yashchenko');
    expect(result.current.orderedTasks.map((t) => t.taskNumber)).toEqual([11, 12, 14, 17]);
    expect(result.current.previous).toEqual(TASK_A);
    expect(result.current.next).toEqual(TASK_C);
  });

  it('resolves the ordered list directly via an already-known variantId (GET /variants/:id)', async () => {
    vi.mocked(api.getVariant).mockResolvedValue(variantDetail([TASK_A, TASK_B]));
    const { result } = renderHook(
      () =>
        useTaskNavigation({
          subjectId: 'math',
          taskId: TASK_A.taskId,
          variantId: 'variant-1',
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.getVariant).toHaveBeenCalledWith('variant-1');
    expect(api.getVariantForTask).not.toHaveBeenCalled();
    expect(result.current.variantId).toBe('variant-1');
  });

  it('previous is null at the start of the ordered list', async () => {
    vi.mocked(api.getVariantForTask).mockResolvedValue(variantDetail([TASK_A, TASK_B]));
    const { result } = renderHook(
      () => useTaskNavigation({ subjectId: 'math', taskId: TASK_A.taskId, collectionSlug: 'slug' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.previous).toBeNull();
    expect(result.current.next).toEqual(TASK_B);
  });

  it('next is null at the end of the ordered list', async () => {
    vi.mocked(api.getVariantForTask).mockResolvedValue(variantDetail([TASK_A, TASK_B]));
    const { result } = renderHook(
      () => useTaskNavigation({ subjectId: 'math', taskId: TASK_B.taskId, collectionSlug: 'slug' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.previous).toEqual(TASK_A);
    expect(result.current.next).toBeNull();
  });

  it('both previous and next are null when the list has only one task', async () => {
    vi.mocked(api.getVariantForTask).mockResolvedValue(variantDetail([TASK_A]));
    const { result } = renderHook(
      () => useTaskNavigation({ subjectId: 'math', taskId: TASK_A.taskId, collectionSlug: 'slug' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.previous).toBeNull();
    expect(result.current.next).toBeNull();
  });

  it('falls back to an empty list (never a crash) when resolution fails — unknown source or task not in any variant', async () => {
    vi.mocked(api.getVariantForTask).mockRejectedValue(new Error('404'));
    const { result } = renderHook(
      () =>
        useTaskNavigation({ subjectId: 'math', taskId: TASK_A.taskId, collectionSlug: 'unknown' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orderedTasks).toEqual([]);
    expect(result.current.previous).toBeNull();
    expect(result.current.next).toBeNull();
  });

  it('handles gap task numbers (11,12,14,17) correctly without ever inventing 13', async () => {
    vi.mocked(api.getVariantForTask).mockResolvedValue(
      variantDetail([TASK_A, TASK_B, TASK_C, TASK_D]),
    );
    const { result } = renderHook(
      () => useTaskNavigation({ subjectId: 'math', taskId: TASK_C.taskId, collectionSlug: 'slug' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orderedTasks.map((t) => t.taskNumber)).not.toContain(13);
    expect(result.current.previous).toEqual(TASK_B);
    expect(result.current.next).toEqual(TASK_D);
  });

  it('goTo navigates preserving subject/collectionSlug/resolved variantId', async () => {
    vi.mocked(api.getVariantForTask).mockResolvedValue(variantDetail([TASK_A, TASK_B]));
    let navigatedRoute: unknown = null;
    function Probe() {
      const { overlay } = useNavigation();
      navigatedRoute = overlay;
      return null;
    }
    const { result } = renderHook(
      () =>
        useTaskNavigation({
          subjectId: 'math',
          taskId: TASK_A.taskId,
          collectionSlug: 'ege-2026-yashchenko',
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) =>
          createElement(NavigationProvider, null, children, createElement(Probe)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    result.current.goTo(TASK_B);
    await waitFor(() =>
      expect((navigatedRoute as { taskId?: string } | null)?.taskId).toBe(TASK_B.taskId),
    );
    expect(navigatedRoute).toMatchObject({
      screen: 'task',
      subjectId: 'math',
      taskNumber: TASK_B.taskNumber,
      taskId: TASK_B.taskId,
      collectionSlug: 'ege-2026-yashchenko',
      variantId: 'variant-1',
    });
  });
});
