import { describe, expect, it, vi } from 'vitest';
import { startCustomVariant, startRealTask } from './startTraining.js';
import * as api from './api.js';

vi.mock('./api.js', () => ({ getRandomTask: vi.fn() }));

const TASK = {
  id: 'task-1',
  subjectId: 'math',
  taskNumber: 7,
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
};

describe('startRealTask', () => {
  it('forwards subject/taskNumber/collection to getRandomTask', () => {
    vi.mocked(api.getRandomTask).mockResolvedValue(TASK);
    const navigate = vi.fn();
    startRealTask(navigate, { subject: 'math', taskNumber: 7, collection: 'ege-2026-yashchenko' });
    expect(api.getRandomTask).toHaveBeenCalledWith({
      subject: 'math',
      taskNumber: 7,
      collection: 'ege-2026-yashchenko',
    });
  });

  it('carries the collection into the navigated task route as collectionSlug', async () => {
    vi.mocked(api.getRandomTask).mockResolvedValue(TASK);
    const navigate = vi.fn();
    startRealTask(navigate, { subject: 'math', collection: 'ege-2026-yashchenko' });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith({
      screen: 'task',
      subjectId: 'math',
      taskNumber: 7,
      taskId: 'task-1',
      collectionSlug: 'ege-2026-yashchenko',
    });
  });

  it('leaves collectionSlug undefined when no collection was given (Общий банк)', async () => {
    vi.mocked(api.getRandomTask).mockResolvedValue(TASK);
    const navigate = vi.fn();
    startRealTask(navigate, { subject: 'math' });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ screen: 'task', collectionSlug: undefined }),
    );
  });
});

describe('startCustomVariant (Task Workspace block — fixes "Варианты → Общие → сформировать вариант" dropping every number but the first)', () => {
  it('resolves every picked number (not just the first) and carries the whole list as customOrderedTasks', async () => {
    vi.mocked(api.getRandomTask).mockImplementation(({ taskNumber }) =>
      Promise.resolve({ ...TASK, id: `task-${taskNumber}`, taskNumber: taskNumber! }),
    );
    const navigate = vi.fn();
    startCustomVariant(navigate, {
      subject: 'math',
      taskNumbers: [1, 3, 4, 7, 10, 15, 19],
      collection: 'ege-2026-yashchenko',
    });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());

    expect(api.getRandomTask).toHaveBeenCalledTimes(7);
    expect(navigate).toHaveBeenCalledWith({
      screen: 'task',
      subjectId: 'math',
      taskNumber: 1,
      taskId: 'task-1',
      collectionSlug: 'ege-2026-yashchenko',
      customOrderedTasks: [
        { taskId: 'task-1', taskNumber: 1 },
        { taskId: 'task-3', taskNumber: 3 },
        { taskId: 'task-4', taskNumber: 4 },
        { taskId: 'task-7', taskNumber: 7 },
        { taskId: 'task-10', taskNumber: 10 },
        { taskId: 'task-15', taskNumber: 15 },
        { taskId: 'task-19', taskNumber: 19 },
      ],
      returnTo: undefined,
    });
  });

  it('never navigates when nothing was picked', () => {
    const navigate = vi.fn();
    startCustomVariant(navigate, { subject: 'math', taskNumbers: [] });
    expect(navigate).not.toHaveBeenCalled();
    expect(api.getRandomTask).not.toHaveBeenCalled();
  });
});
