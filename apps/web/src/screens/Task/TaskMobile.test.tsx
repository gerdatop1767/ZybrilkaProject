import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskMobile } from './TaskMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getTask: vi.fn(),
  listTasksByNumber: vi.fn(),
  submitAttempt: vi.fn(),
  getVariant: vi.fn(),
  getVariantForTask: vi.fn(),
}));

const TASK_ID = '11111111-1111-1111-1111-111111111111';
const SIBLING_A = '22222222-2222-2222-2222-222222222222';
const SIBLING_B = '33333333-3333-3333-3333-333333333333';
const CORRECT_ANSWER = '(−∞; −1] ∪ [2; +∞)';
const CONDITION = 'Решите неравенство: log₂(x² − 3x − 4) ≥ 1';
const EXPLANATION = 'Приводим к общему основанию и решаем полученную систему.';
const TASK_CODE = `#${TASK_ID.slice(0, 8)}`;
const SIBLING_A_CODE = `#${SIBLING_A.slice(0, 8)}`;
const SIBLING_B_CODE = `#${SIBLING_B.slice(0, 8)}`;

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
  if (overlay?.screen === 'subject') {
    return (
      <p data-testid="overlay">
        subject:{overlay.subjectId}:{overlay.initialMode ?? 'no-mode'}
      </p>
    );
  }
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderTask() {
  return render(
    <NavigationProvider>
      <TaskMobile
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
      <TaskMobile
        subjectId={baseTask.subjectId}
        taskNumber={baseTask.taskNumber}
        taskId={TASK_ID}
        collectionSlug={COLLECTION_SLUG}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

/** userEvent.type() parses [ ] { } as key-modifier syntax, so answers
 * like "(−∞; −1] ∪ [2; +∞)" must be pasted in, not typed. */
async function pasteAnswer(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = await screen.findByLabelText('Ответ');
  await user.click(input);
  await user.paste(text);
}

describe('TaskMobile', () => {
  beforeEach(() => {
    vi.mocked(api.getTask).mockResolvedValue(baseTask);
    vi.mocked(api.listTasksByNumber).mockResolvedValue(siblings);
    vi.mocked(api.submitAttempt).mockImplementation((_taskId, { answer }) =>
      Promise.resolve(
        typeof answer === 'string' && answer.trim() === CORRECT_ANSWER
          ? {
              correct: true,
              correctAnswer: CORRECT_ANSWER,
              explanation: EXPLANATION,
              attemptId: 'a1',
              mistakeId: null,
            }
          : {
              correct: false,
              correctAnswer: CORRECT_ANSWER,
              explanation: EXPLANATION,
              attemptId: 'a2',
              mistakeId: 'm1',
            },
      ),
    );
  });

  it('renders the task condition and code', async () => {
    renderTask();
    expect(await screen.findByText(CONDITION)).toBeInTheDocument();
    expect(screen.getByText(TASK_CODE, { exact: false })).toBeInTheDocument();
  });

  it('renders the tools panel collapsed by default (04b variant)', async () => {
    renderTask();
    await screen.findByText(CONDITION);
    expect(screen.getByRole('button', { name: /Дополнительные инструменты/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Кальк.' })).not.toBeInTheDocument();
  });

  it('has no old keyboard shortcut button next to the answer field', async () => {
    renderTask();
    await screen.findByText(CONDITION);
    expect(screen.queryByRole('button', { name: 'Клавиатура' })).not.toBeInTheDocument();
  });

  it('opens the tools panel via the pencil icon, not a chevron', async () => {
    renderTask();
    await screen.findByText(CONDITION);
    const pencilButton = screen.getByRole('button', { name: 'Дополнительные инструменты' });
    expect(pencilButton.querySelector('svg.lucide-pencil')).toBeInTheDocument();
  });

  it('expands the tools panel to reveal the 5 tools', async () => {
    const user = userEvent.setup();
    renderTask();
    await screen.findByText(CONDITION);
    await user.click(screen.getByRole('button', { name: /Дополнительные инструменты/ }));
    expect(screen.getByRole('button', { name: 'Кальк.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Полотно' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Шаблоны' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Справочник' })).toBeInTheDocument();
  });

  it('renders "Другие задания" collapsed by default with real sibling tasks', async () => {
    const user = userEvent.setup();
    renderTask();
    await screen.findByText(CONDITION);
    expect(
      screen.queryByRole('button', { name: new RegExp(SIBLING_A_CODE) }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Другие задания/ }));
    expect(screen.getByRole('button', { name: new RegExp(SIBLING_A_CODE) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(SIBLING_B_CODE) })).toBeInTheDocument();
  });

  it('disables Проверить until an answer is entered', async () => {
    const user = userEvent.setup();
    renderTask();
    const submit = await screen.findByRole('button', { name: /Проверить ответ/ });
    expect(submit).toBeDisabled();
    await pasteAnswer(user, CORRECT_ANSWER);
    expect(submit).toBeEnabled();
  });

  it('submits the answer and navigates to a correct Result', async () => {
    const user = userEvent.setup();
    renderTask();
    await pasteAnswer(user, CORRECT_ANSWER);
    const submit = screen.getByRole('button', { name: /Проверить ответ/ });
    await user.click(submit);
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('result:correct');
    });
  });

  it('navigates to an incorrect Result for the wrong answer', async () => {
    const user = userEvent.setup();
    renderTask();
    await pasteAnswer(user, 'нет такого ответа');
    await user.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('result:incorrect');
    });
  });

  it('toggles the hint', async () => {
    const user = userEvent.setup();
    renderTask();
    const toggle = await screen.findByRole('button', { name: 'Подсказка' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('inserts a math symbol into the answer field via the fx toggle', async () => {
    const user = userEvent.setup();
    renderTask();
    await screen.findByText(CONDITION);
    await user.click(screen.getByRole('button', { name: 'Математические символы' }));
    await user.click(screen.getByRole('button', { name: '∞' }));
    expect(screen.getByLabelText('Ответ')).toHaveValue('∞');
  });

  it('calls back() from the header back button', async () => {
    const user = userEvent.setup();
    renderTask();
    await screen.findByText(CONDITION);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
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

    it('submits one object payload once every part is filled', async () => {
      const user = userEvent.setup();
      renderTask();
      const submit = await screen.findByRole('button', { name: /Проверить ответ/ });
      expect(submit).toBeDisabled();

      await user.click(screen.getByLabelText('Ответ а)'));
      await user.paste('нет');
      await user.click(screen.getByLabelText('Ответ б)'));
      await user.paste('607');
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

  describe('back-arrow return context (audit Block 3)', () => {
    it('returns to the given returnTo route instead of collapsing to Home', async () => {
      const user = userEvent.setup();
      render(
        <NavigationProvider>
          <TaskMobile
            subjectId={baseTask.subjectId}
            taskNumber={baseTask.taskNumber}
            taskId={TASK_ID}
            returnTo={{ screen: 'subject', subjectId: baseTask.subjectId, initialMode: 'byNumber' }}
          />
          <OverlayMarker />
        </NavigationProvider>,
      );
      await screen.findByText(CONDITION);
      await user.click(screen.getByRole('button', { name: 'Назад' }));
      expect(screen.getByTestId('overlay')).toHaveTextContent(
        `subject:${baseTask.subjectId}:byNumber`,
      );
    });

    it('falls back to the old back() behavior when no returnTo is given', async () => {
      const user = userEvent.setup();
      renderTask();
      await screen.findByText(CONDITION);
      await user.click(screen.getByRole('button', { name: 'Назад' }));
      expect(screen.getByTestId('overlay')).toHaveTextContent('none');
    });

    it('carries returnTo through Skip, so the parent context survives moving to a sibling task', async () => {
      vi.mocked(api.getVariantForTask).mockResolvedValue(twoTaskVariant);
      const user = userEvent.setup();
      render(
        <NavigationProvider>
          <TaskMobile
            subjectId={baseTask.subjectId}
            taskNumber={baseTask.taskNumber}
            taskId={TASK_ID}
            collectionSlug={COLLECTION_SLUG}
            returnTo={{ screen: 'mistakes' }}
          />
          <OverlayMarker />
        </NavigationProvider>,
      );
      const skip = await screen.findByRole('button', { name: /Пропустить/ });
      await waitFor(() => expect(skip).toBeEnabled());
      await user.click(skip);
      await waitFor(() => {
        expect(screen.getByTestId('overlay')).toHaveTextContent('task:');
      });
      await user.click(screen.getByRole('button', { name: 'Назад' }));
      expect(screen.getByTestId('overlay')).toHaveTextContent('mistakes');
    });
  });
});
