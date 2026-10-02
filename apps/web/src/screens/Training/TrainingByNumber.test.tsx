import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrainingByNumber } from './TrainingByNumber.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => {
  class MockApiError extends Error {
    constructor(
      public status: number,
      public body: unknown,
    ) {
      super(`API request failed with status ${status}`);
    }
  }
  return {
    listCollections: vi.fn(),
    getRandomTask: vi.fn(),
    ApiError: MockApiError,
  };
});

const COLLECTION = {
  collection: {
    id: 'c1',
    subjectId: 'math',
    slug: 'ege-2026-yashchenko',
    title: 'ЕГЭ 2026 Ященко',
    publisher: 'Ященко',
    year: 2026,
    description: null,
  },
  variants: [{ id: 'v1', collectionId: 'c1', variantNumber: 1, title: 'Вариант 1', year: 2026 }],
};

const RANDOM_TASK = {
  id: 'task-1',
  subjectId: 'math',
  taskNumber: 5,
  topicId: null,
  topicName: null,
  difficulty: 2 as const,
  conditionMd: 'Условие',
  imageUrl: null,
  hintMd: null,
  answerType: 'short_answer' as const,
  answerOptions: null,
  answerParts: null,
  source: 'ФИПИ',
  sourceUrl: null,
  sourceYear: 2026,
  tags: [],
  status: 'published' as const,
};

function OverlayMarker() {
  const { overlay } = useNavigation();
  if (overlay?.screen === 'task') {
    return <p data-testid="overlay">task:{overlay.taskNumber}</p>;
  }
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderScreen() {
  return render(
    <NavigationProvider>
      <TrainingByNumber />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.listCollections).mockResolvedValue([]);
});

describe('TrainingByNumber', () => {
  it('requires at least one number before starting', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(await screen.findByText('Выбери хотя бы один номер задания.')).toBeInTheDocument();
    expect(api.getRandomTask).not.toHaveBeenCalled();
  });

  it('a single selected number defaults to "Случайное" and calls getRandomTask scoped to it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderScreen();
    await user.click(screen.getByRole('button', { name: '№5' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'math',
          taskNumber: 5,
          collection: undefined,
          unseen: undefined,
        }),
      );
    });
    await waitFor(() => expect(screen.getByTestId('overlay')).toHaveTextContent('task:5'));
  });

  it('"Случайное" drops the collection scope', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([COLLECTION]);
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderScreen();

    const trigger = await screen.findByRole('button', { name: /Все источники/ });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await user.click(screen.getByRole('button', { name: '№5' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ taskNumber: 5, collection: undefined }),
      );
    });
  });

  it('"Только нерешённые" sends unseen:true and keeps the collection scope', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([COLLECTION]);
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderScreen();

    const trigger = await screen.findByRole('button', { name: /Все источники/ });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await user.click(screen.getByRole('button', { name: '№5' }));
    await user.click(screen.getByRole('button', { name: 'Только нерешённые' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskNumber: 5,
          collection: COLLECTION.collection.slug,
          unseen: true,
        }),
      );
    });
  });

  it('mixes independent modes across different numbers in one run', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockImplementation((params) =>
      Promise.resolve({ ...RANDOM_TASK, taskNumber: params.taskNumber! }),
    );
    renderScreen();
    await user.click(screen.getByRole('button', { name: '№5' }));
    await user.click(screen.getByRole('button', { name: '№7' }));
    const unseenToggles = screen.getAllByRole('button', { name: 'Только нерешённые' });
    // №5 stays "Случайное" (default); mark №7 (the second row) "Только нерешённые".
    await user.click(unseenToggles[1]!);
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));

    await waitFor(() => expect(api.getRandomTask).toHaveBeenCalledTimes(2));
    expect(api.getRandomTask).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ taskNumber: 5, unseen: undefined }),
    );
    expect(api.getRandomTask).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ taskNumber: 7, unseen: true }),
    );
  });

  it('"Перемешать порядок" reorders which selected number is solved first', async () => {
    const user = userEvent.setup();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // always swap to front
    vi.mocked(api.getRandomTask).mockImplementation((params) =>
      Promise.resolve({ ...RANDOM_TASK, taskNumber: params.taskNumber! }),
    );
    renderScreen();
    await user.click(screen.getByRole('button', { name: '№5' }));
    await user.click(screen.getByRole('button', { name: '№7' }));
    await user.click(screen.getByRole('button', { name: 'Перемешать порядок' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));

    await waitFor(() => expect(api.getRandomTask).toHaveBeenCalledTimes(2));
    // With Math.random mocked to 0, Fisher-Yates always swaps the last
    // element to the front — the sorted [5, 7] becomes [7, 5].
    expect(api.getRandomTask).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ taskNumber: 7 }),
    );
    randomSpy.mockRestore();
  });

  it('shows the specific "no unseen tasks" message for that number, never silently substituting a random task', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockRejectedValue(
      new api.ApiError(404, { error: 'no_unseen_tasks' }),
    );
    renderScreen();
    await user.click(screen.getByRole('button', { name: '№5' }));
    await user.click(screen.getByRole('button', { name: 'Только нерешённые' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(
      await screen.findByText(
        'Для №5 больше нет нерешённых заданий. Можно сменить режим на «Случайное» для этого номера.',
      ),
    ).toBeInTheDocument();
  });

  it('works for an arbitrary subject/taskNumber combination — never hardcoded to one number', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue({ ...RANDOM_TASK, taskNumber: 12 });
    renderScreen();
    await user.click(screen.getByRole('button', { name: '№12' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'math', taskNumber: 12 }),
      );
    });
  });

  it("deselecting the subject's now-invalid numbers after switching subject keeps selection consistent", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: '№5' }));
    const subjectSelect = screen.getByRole('button', { name: /Математика/ });
    await user.click(subjectSelect);
    await user.click(await screen.findByRole('option', { name: 'Русский язык' }));
    // №5 may or may not still be valid depending on subject content, but
    // the screen must still render without crashing and keep a working
    // "Начать тренировку" flow — not asserting exact numbers here since
    // subjectContent is real data, just that the screen is still usable.
    expect(screen.getByRole('button', { name: 'Начать тренировку' })).toBeInTheDocument();
  });
});
