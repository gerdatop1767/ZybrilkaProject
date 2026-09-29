import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDesktop } from './TaskDesktop.js';
import { subjects } from '../../data/subjects.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';
import { resetFavoritesCacheForTests } from '../../lib/useFavorite.js';

vi.mock('../../lib/api.js', () => ({
  getTask: vi.fn(),
  listTasksByNumber: vi.fn(),
  submitAttempt: vi.fn(),
  getVariant: vi.fn(),
  getVariantForTask: vi.fn(),
  listFavoriteTaskIds: vi.fn(() => Promise.resolve({ taskIds: [] })),
  addFavorite: vi.fn(() => Promise.resolve()),
  removeFavorite: vi.fn(() => Promise.resolve()),
}));

const TASK_ID = '11111111-1111-1111-1111-111111111111';
const SIBLING_A = '22222222-2222-2222-2222-222222222222';
const SIBLING_B = '33333333-3333-3333-3333-333333333333';
const CORRECT_ANSWER = '(−∞; −1] ∪ [2; +∞)';
const CONDITION = 'Решите неравенство: log₂(x² − 3x − 4) ≥ 1';
const EXPLANATION = 'Приводим к общему основанию и решаем полученную систему.';

const baseTask = {
  id: TASK_ID,
  subjectId: 'math',
  taskNumber: 15,
  topicId: null,
  topicName: 'Логарифмы',
  difficulty: 3 as const,
  conditionMd: CONDITION,
  imageUrl: null,
  hintMd: 'Проверь область допустимых значений перед возведением в квадрат.',
  answerType: 'short_answer' as const,
  answerParts: null,
  answerOptions: null,
  source: 'ФИПИ',
  sourceUrl: null,
  sourceYear: 2026,
  tags: [],
  status: 'published' as const,
};

const siblings = [
  baseTask,
  { ...baseTask, id: SIBLING_A, conditionMd: 'log₅(x − 1) ≤ 2' },
  { ...baseTask, id: SIBLING_B, conditionMd: 'log₃(x + 2) + log₃x ≥ 1' },
];

const COLLECTION_SLUG = 'ege-2026-yashchenko';
const VARIANT_ID = 'variant-1';
const NEXT_TASK_ID = '44444444-4444-4444-4444-444444444444';

const variantCollection = {
  id: 'c1',
  subjectId: 'math',
  slug: COLLECTION_SLUG,
  title: 'ЕГЭ 2026 Ященко',
  publisher: 'Ященко',
  year: 2026,
  description: null,
};

const variantMeta = {
  id: VARIANT_ID,
  collectionId: 'c1',
  variantNumber: 1,
  title: 'Вариант 1',
  year: 2026,
};

/** Two-task ordered variant — TASK_ID has a real "next" task to skip to. */
const twoTaskVariant = {
  variant: variantMeta,
  collection: variantCollection,
  tasks: [
    { position: 1, task: { ...baseTask, id: TASK_ID } },
    { position: 2, task: { ...baseTask, id: NEXT_TASK_ID, taskNumber: 16 } },
  ],
};

/** Single-task variant — TASK_ID is both first and last, no "next". */
const oneTaskVariant = {
  variant: variantMeta,
  collection: variantCollection,
  tasks: [{ position: 1, task: { ...baseTask, id: TASK_ID } }],
};

function OverlayMarker() {
  const { overlay } = useNavigation();
  if (overlay?.screen === 'result') {
    return <p data-testid="overlay">result:{overlay.correct ? 'correct' : 'incorrect'}</p>;
  }
  if (overlay?.screen === 'task') {
    return (
      <p data-testid="overlay">
        task:{overlay.taskId}:{overlay.collectionSlug ?? 'no-collection'}:
        {overlay.variantId ?? 'no-variant'}
      </p>
    );
  }
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderTask() {
  return render(
    <NavigationProvider>
      <TaskDesktop
        subjectId={baseTask.subjectId}
        taskNumber={baseTask.taskNumber}
        taskId={TASK_ID}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

function renderTaskWithVariantContext() {
  return render(
    <NavigationProvider>
      <TaskDesktop
        subjectId={baseTask.subjectId}
        taskNumber={baseTask.taskNumber}
        taskId={TASK_ID}
        collectionSlug={COLLECTION_SLUG}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

async function pasteAnswer(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = await screen.findByLabelText('Ответ');
  await user.click(input);
  await user.paste(text);
}

describe('TaskDesktop', () => {
  beforeEach(() => {
    resetFavoritesCacheForTests();
    vi.mocked(api.getTask).mockResolvedValue(baseTask);
    vi.mocked(api.listTasksByNumber).mockResolvedValue(siblings);
    vi.mocked(api.submitAttempt).mockImplementation((_taskId, { answer }) =>
      Promise.resolve(
        typeof answer === 'string' && answer.trim() === CORRECT_ANSWER
          ? {
              correct: true,
              correctAnswer: CORRECT_ANSWER,
              correctAnswerDisplay: null,
              explanation: EXPLANATION,
              attemptId: 'a1',
              mistakeId: null,
            }
          : {
              correct: false,
              correctAnswer: CORRECT_ANSWER,
              correctAnswerDisplay: null,
              explanation: EXPLANATION,
              attemptId: 'a2',
              mistakeId: 'm1',
            },
      ),
    );
  });

  it('fetches the real task and renders its condition', async () => {
    renderTask();
    expect(await screen.findByText(CONDITION)).toBeInTheDocument();
    const subject = subjects.find((s) => s.id === baseTask.subjectId)!;
    expect(screen.getAllByText(subject.shortName, { exact: false }).length).toBeGreaterThan(0);
  });

  it('renders the session progress ring and other-tasks sidebar', async () => {
    renderTask();
    await screen.findByText(CONDITION);
    expect(screen.getByText('Прогресс в теме')).toBeInTheDocument();
    expect(screen.getByText('Другие задания')).toBeInTheDocument();
    expect(screen.getByText('Инструменты')).toBeInTheDocument();
  });

  it('disables Проверить until an answer is entered', async () => {
    const user = userEvent.setup();
    renderTask();
    await screen.findByText(CONDITION);
    const submit = screen.getByRole('button', { name: /Проверить ответ/ });
    expect(submit).toBeDisabled();
    await pasteAnswer(user, CORRECT_ANSWER);
    expect(submit).toBeEnabled();
  });

  it('submits the answer to the API and navigates to a correct Result', async () => {
    const user = userEvent.setup();
    renderTask();
    await pasteAnswer(user, CORRECT_ANSWER);
    const submit = screen.getByRole('button', { name: /Проверить ответ/ });
    await user.click(submit);
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('result:correct');
    });
    expect(api.submitAttempt).toHaveBeenCalledWith(TASK_ID, { answer: CORRECT_ANSWER });
  });

  it('navigates to an incorrect Result for the wrong answer, per the server response', async () => {
    const user = userEvent.setup();
    renderTask();
    await pasteAnswer(user, 'неверный ответ');
    await user.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('result:incorrect');
    });
  });

  it('toggles the hint', async () => {
    const user = userEvent.setup();
    renderTask();
    const toggle = await screen.findByRole('button', { name: 'Показать подсказку' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls back() from the breadcrumb back button', async () => {
    const user = userEvent.setup();
    renderTask();
    await screen.findByText(CONDITION);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });

  it('never renders the task.imageUrl as a raw image — even a task with one (EGE Fidelity audit, Block 4)', async () => {
    const imageUrl = '/tasks/imports/ege-2026-variant-1/task-08-graph.png';
    vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, imageUrl });
    renderTask();
    await screen.findByText(CONDITION);
    expect(screen.queryByRole('img', { name: 'Иллюстрация к заданию' })).not.toBeInTheDocument();
  });

  it('renders our own verified SVG reconstruction for a task with a real original diagram (e.g. task 11)', async () => {
    vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, taskNumber: 11 });
    vi.mocked(api.listTasksByNumber).mockResolvedValue([{ ...baseTask, taskNumber: 11 }]);
    renderTask();
    await screen.findByText(CONDITION);
    expect(document.querySelector('svg[role="img"]')).toBeInTheDocument();
  });

  describe('calculator (Task Workspace block 3)', () => {
    it('opens from "Инструменты" → "Калькулятор", computes a real result, and closes without touching the typed answer', async () => {
      const user = userEvent.setup();
      renderTask();
      await screen.findByText(CONDITION);

      await pasteAnswer(user, '42');
      await user.click(screen.getByRole('button', { name: 'Калькулятор' }));

      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: '7' }));
      await user.click(within(dialog).getByRole('button', { name: '+' }));
      await user.click(within(dialog).getByRole('button', { name: '3' }));
      await user.click(within(dialog).getByRole('button', { name: '=' }));
      expect(within(dialog).getByTestId('calculator-display')).toHaveTextContent('10');

      await user.click(within(dialog).getByRole('button', { name: 'Закрыть' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Ответ')).toHaveValue('42');
    });
  });

  describe('favorite (Task Workspace block — real bookmark, not local-only state)', () => {
    it('starts unfavorited, toggles to favorited via a real POST, and reflects it visually', async () => {
      vi.mocked(api.listFavoriteTaskIds).mockResolvedValue({ taskIds: [] });
      vi.mocked(api.addFavorite).mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderTask();
      await screen.findByText(CONDITION);

      const button = await screen.findByRole('button', { name: 'В избранное' });
      expect(button).toHaveAttribute('aria-pressed', 'false');

      await user.click(button);
      await waitFor(() => expect(api.addFavorite).toHaveBeenCalledWith(TASK_ID));
      expect(await screen.findByRole('button', { name: 'Убрать из избранного' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('starts favorited when the server says so, and toggling off calls DELETE', async () => {
      vi.mocked(api.listFavoriteTaskIds).mockResolvedValue({ taskIds: [TASK_ID] });
      vi.mocked(api.removeFavorite).mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderTask();
      await screen.findByText(CONDITION);

      const button = await screen.findByRole('button', { name: 'Убрать из избранного' });
      expect(button).toHaveAttribute('aria-pressed', 'true');

      await user.click(button);
      await waitFor(() => expect(api.removeFavorite).toHaveBeenCalledWith(TASK_ID));
      expect(await screen.findByRole('button', { name: 'В избранное' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('a different task never inherits another task’s favorite state (task-specific, not global)', async () => {
      vi.mocked(api.listFavoriteTaskIds).mockResolvedValue({ taskIds: [TASK_ID] });
      renderTask();
      await screen.findByRole('button', { name: 'Убрать из избранного' });

      vi.mocked(api.getTask).mockResolvedValue({ ...baseTask, id: SIBLING_A });
      render(
        <NavigationProvider>
          <TaskDesktop
            subjectId={baseTask.subjectId}
            taskNumber={baseTask.taskNumber}
            taskId={SIBLING_A}
          />
        </NavigationProvider>,
      );
      expect(await screen.findAllByRole('button', { name: 'В избранное' })).not.toHaveLength(0);
    });
  });

  describe('multi_part task', () => {
    const multiPartTask = {
      ...baseTask,
      answerType: 'multi_part' as const,
      answerParts: [
        { id: 'a', label: 'а' },
        { id: 'b', label: 'б' },
        { id: 'c', label: 'в' },
      ],
    };

    beforeEach(() => {
      vi.mocked(api.getTask).mockResolvedValue(multiPartTask);
      vi.mocked(api.listTasksByNumber).mockResolvedValue([multiPartTask]);
    });

    it('renders one labeled input per part instead of the single answer field', async () => {
      renderTask();
      await screen.findByText(CONDITION);
      expect(screen.getByLabelText('Ответ а)')).toBeInTheDocument();
      expect(screen.getByLabelText('Ответ б)')).toBeInTheDocument();
      expect(screen.getByLabelText('Ответ в)')).toBeInTheDocument();
      expect(screen.queryByLabelText('Ответ')).not.toBeInTheDocument();
    });

    it('keeps Проверить disabled until every part has an answer, then submits one object payload', async () => {
      const user = userEvent.setup();
      renderTask();
      const submit = await screen.findByRole('button', { name: /Проверить ответ/ });
      expect(submit).toBeDisabled();

      await user.click(screen.getByLabelText('Ответ а)'));
      await user.paste('нет');
      expect(submit).toBeDisabled();
      await user.click(screen.getByLabelText('Ответ б)'));
      await user.paste('607');
      expect(submit).toBeDisabled();
      await user.click(screen.getByLabelText('Ответ в)'));
      await user.paste('1066');
      expect(submit).toBeEnabled();

      await user.click(submit);
      await waitFor(() => {
        expect(api.submitAttempt).toHaveBeenCalledWith(TASK_ID, {
          answer: { a: 'нет', b: '607', c: '1066' },
        });
      });
    });
  });

  describe('Пропустить (skip)', () => {
    it('skips from the first task to the next real task in the variant, using useTaskNavigation', async () => {
      vi.mocked(api.getVariantForTask).mockResolvedValue(twoTaskVariant);
      const user = userEvent.setup();
      renderTaskWithVariantContext();
      const skip = await screen.findByRole('button', { name: /Пропустить/ });
      await waitFor(() => expect(skip).toBeEnabled());
      await user.click(skip);
      await waitFor(() => {
        expect(screen.getByTestId('overlay')).toHaveTextContent(`task:${NEXT_TASK_ID}`);
      });
    });

    it('preserves the current source/collection when skipping', async () => {
      vi.mocked(api.getVariantForTask).mockResolvedValue(twoTaskVariant);
      const user = userEvent.setup();
      renderTaskWithVariantContext();
      const skip = await screen.findByRole('button', { name: /Пропустить/ });
      await waitFor(() => expect(skip).toBeEnabled());
      await user.click(skip);
      await waitFor(() => {
        expect(screen.getByTestId('overlay')).toHaveTextContent(COLLECTION_SLUG);
      });
    });

    it('preserves the resolved variant when skipping', async () => {
      vi.mocked(api.getVariantForTask).mockResolvedValue(twoTaskVariant);
      const user = userEvent.setup();
      renderTaskWithVariantContext();
      const skip = await screen.findByRole('button', { name: /Пропустить/ });
      await waitFor(() => expect(skip).toBeEnabled());
      await user.click(skip);
      await waitFor(() => {
        expect(screen.getByTestId('overlay')).toHaveTextContent(VARIANT_ID);
      });
    });

    it('does not submit an attempt (no correct/incorrect, no completion) when skipping', async () => {
      vi.mocked(api.getVariantForTask).mockResolvedValue(twoTaskVariant);
      const user = userEvent.setup();
      renderTaskWithVariantContext();
      const skip = await screen.findByRole('button', { name: /Пропустить/ });
      await waitFor(() => expect(skip).toBeEnabled());
      await user.click(skip);
      await waitFor(() => {
        expect(screen.getByTestId('overlay')).toHaveTextContent('task:');
      });
      expect(api.submitAttempt).not.toHaveBeenCalled();
    });

    it('disables Пропустить on the last task of the variant, so it never leaves the source boundary', async () => {
      vi.mocked(api.getVariantForTask).mockResolvedValue(oneTaskVariant);
      const user = userEvent.setup();
      renderTaskWithVariantContext();
      await screen.findByText(CONDITION);
      const skip = await screen.findByRole('button', { name: /Пропустить/ });
      await waitFor(() => expect(skip).toBeDisabled());
      await user.click(skip);
      expect(screen.getByTestId('overlay')).toHaveTextContent('none');
    });
  });
});
