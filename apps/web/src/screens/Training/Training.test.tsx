import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Training } from './Training.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import {
  LearningSessionProvider,
  useLearningSessionContext,
} from '../../lib/learningSessionContext.js';
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
    getVariant: vi.fn(),
    startLearningSession: vi.fn(),
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

function SessionMarker() {
  const { session } = useLearningSessionContext();
  return <p data-testid="session">{session ? `${session.status}:${session.sessionId}` : 'none'}</p>;
}

function renderTraining() {
  return render(
    <NavigationProvider>
      <LearningSessionProvider>
        <Training />
        <OverlayMarker />
        <SessionMarker />
      </LearningSessionProvider>
    </NavigationProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.listCollections).mockResolvedValue([]);
});

describe('Training', () => {
  it('renders all training mode options', () => {
    renderTraining();
    expect(screen.getByRole('button', { name: /По теме/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Мои ошибки/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Умная тренировка/ })).toBeInTheDocument();
  });

  it('selects a training mode and shows clear selected-state feedback', async () => {
    const user = userEvent.setup();
    renderTraining();
    const topicMode = screen.getByRole('button', { name: /По теме/ });
    const mistakesMode = screen.getByRole('button', { name: /Мои ошибки/ });
    expect(topicMode).toHaveAttribute('aria-pressed', 'true');
    await user.click(mistakesMode);
    expect(mistakesMode).toHaveAttribute('aria-pressed', 'true');
    expect(topicMode).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects a difficulty chip', async () => {
    const user = userEvent.setup();
    renderTraining();
    const hard = screen.getByRole('button', { name: 'Сложный' });
    await user.click(hard);
    expect(hard).toHaveAttribute('aria-pressed', 'true');
  });

  it('fetches a real random task and navigates to it on start', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task:5');
    });
    expect(api.getRandomTask).toHaveBeenCalledWith({
      subject: 'math',
      collection: undefined,
      taskNumber: undefined,
    });
  });

  it('passes a typed task number ("по заданиям") to the real random-task query', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();
    await user.type(screen.getByLabelText('Номер задания'), '5');
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(expect.objectContaining({ taskNumber: 5 }));
    });
  });

  it('navigates straight to the real Mistakes screen for "Мои ошибки", without fetching a task', async () => {
    const user = userEvent.setup();
    renderTraining();
    await user.click(screen.getByRole('button', { name: /Мои ошибки/ }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('mistakes');
    expect(api.getRandomTask).not.toHaveBeenCalled();
  });

  it('lists real collections ("Сборник") and scopes the random query to the chosen one', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([COLLECTION]);
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();

    const trigger = await screen.findByRole('button', { name: /Все источники/ });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'ege-2026-yashchenko' }),
      );
    });
  });

  it('starts the real ordered "Полный вариант" at its first task', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([COLLECTION]);
    vi.mocked(api.getVariant).mockResolvedValue({
      variant: COLLECTION.variants[0]!,
      collection: COLLECTION.collection,
      tasks: [
        { position: 1, task: RANDOM_TASK },
        { position: 2, task: { ...RANDOM_TASK, id: 'task-2', taskNumber: 6 } },
      ],
    });
    renderTraining();

    await user.click(screen.getByRole('button', { name: /^Вариант/ }));
    const collectionTrigger = await screen.findByRole('button', { name: /Все источники/ });
    await user.click(collectionTrigger);
    await user.click(await screen.findByRole('option', { name: 'ЕГЭ 2026 Ященко' }));
    await user.click(await screen.findByRole('button', { name: 'Вариант 1' }));

    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task:5');
    });
    expect(api.getVariant).toHaveBeenCalledWith('v1');
  });

  it('shows an error instead of crashing when no matching task is found', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockRejectedValue(new Error('no tasks'));
    renderTraining();
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(await screen.findByText(/Не нашлось подходящих заданий/)).toBeInTheDocument();
  });
});

describe('Training — "Умная тренировка" (Phase 10: real backend learning session)', () => {
  it('starts a real session via the API and stores the real sessionId, never a fake one', async () => {
    const user = userEvent.setup();
    vi.mocked(api.startLearningSession).mockResolvedValue({
      sessionId: 'session-42',
      subject: 'math',
      status: 'active',
      position: 1,
      total: 10,
      task: RANDOM_TASK,
    });
    renderTraining();

    await user.click(screen.getByRole('button', { name: /Умная тренировка/ }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));

    await waitFor(() => {
      expect(api.startLearningSession).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: 'math', limit: 10 }),
      );
    });
    // Navigates straight into the EXISTING task overlay with the real
    // task the backend picked — never a second task-solving screen.
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task:5');
    });
    expect(screen.getByTestId('session')).toHaveTextContent('active:session-42');
  });

  it('shows an error and never fakes a session when the backend can find no candidate task', async () => {
    const user = userEvent.setup();
    vi.mocked(api.startLearningSession).mockResolvedValue(null);
    renderTraining();

    await user.click(screen.getByRole('button', { name: /Умная тренировка/ }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));

    expect(
      await screen.findByText(/Не нашлось подходящих заданий для умной тренировки/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('session')).toHaveTextContent('none');
    expect(screen.getByTestId('overlay')).not.toHaveTextContent('task');
  });

  it('routes an immediately-completed session (no candidates at all) to the summary screen, not a fake task', async () => {
    const user = userEvent.setup();
    vi.mocked(api.startLearningSession).mockResolvedValue({
      sessionId: 'session-empty',
      subject: 'math',
      status: 'completed',
      position: 0,
      total: 10,
      summary: {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        accuracy: null,
        skillsPracticed: 0,
        mistakesCreated: 0,
      },
    });
    renderTraining();

    await user.click(screen.getByRole('button', { name: /Умная тренировка/ }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));

    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('learningSession');
    });
    expect(screen.getByTestId('session')).toHaveTextContent('completed:session-empty');
  });
});

describe('Training — "По номерам" (multi-select task-number training)', () => {
  it('requires at least one number before starting', async () => {
    const user = userEvent.setup();
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(await screen.findByText('Выбери хотя бы один номер задания.')).toBeInTheDocument();
    expect(api.getRandomTask).not.toHaveBeenCalled();
  });

  it('a single selected number defaults to "Случайное" and calls getRandomTask scoped to it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));
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
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));

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
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));

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
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));
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
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));
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
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));
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
    renderTraining();
    await user.click(screen.getByRole('button', { name: /По номерам/ }));
    await user.click(screen.getByRole('button', { name: '№12' }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'math', taskNumber: 12 }),
      );
    });
  });
});
