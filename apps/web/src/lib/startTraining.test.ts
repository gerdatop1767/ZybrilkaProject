import { describe, expect, it, vi } from 'vitest';
import { startRealTask } from './startTraining.js';
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
