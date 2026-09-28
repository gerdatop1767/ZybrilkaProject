import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { serializeMultiPartSpec, serializeMultiPartUserAnswer } from '@zybrilka/shared';
import { ResultDesktop } from './ResultDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getTask: vi.fn(),
  listTasksByNumber: vi.fn(),
  getVariant: vi.fn(),
  getVariantForTask: vi.fn(),
}));

const TASK_ID = '11111111-1111-1111-1111-111111111111';
const SIBLING_A = '22222222-2222-2222-2222-222222222222';
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

const taskWithSolution = { ...baseTask, correctAnswer: CORRECT_ANSWER, explanationMd: EXPLANATION };
const siblings = [baseTask, { ...baseTask, id: SIBLING_A, conditionMd: 'log₅(x − 1) ≤ 2' }];

function OverlayMarker() {
  const { overlay } = useNavigation();
  if (overlay?.screen === 'subject') {
    return (
      <p data-testid="overlay">
        subject:{overlay.subjectId}:{overlay.collectionSlug ?? 'no-collection'}:
        {overlay.initialMode ?? 'no-mode'}
      </p>
    );
  }
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderResult(correct: boolean, userAnswer = correct ? CORRECT_ANSWER : '(−∞; 2]') {
  return render(
    <NavigationProvider>
      <ResultDesktop
        subjectId={baseTask.subjectId}
        taskNumber={baseTask.taskNumber}
        taskId={TASK_ID}
        correct={correct}
        userAnswer={userAnswer}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.getTask).mockResolvedValue(taskWithSolution);
  vi.mocked(api.listTasksByNumber).mockResolvedValue(siblings);
});

describe('ResultDesktop — correct state', () => {
  it('shows the success banner and the sidebar result card', async () => {
    renderResult(true);
    expect(await screen.findAllByText('Правильно!')).not.toHaveLength(0);
    expect(screen.getByText('Результат')).toBeInTheDocument();
    expect(screen.getByText('Задания в теме')).toBeInTheDocument();
  });

  it('shows the explanation as the solution, without a краткое/подробное toggle', async () => {
    renderResult(true);
    expect(await screen.findByText(EXPLANATION)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Краткое решение' })).not.toBeInTheDocument();
  });

  it('navigates to the next task in the resolved variant, and stays put with no variant context', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await screen.findByText(EXPLANATION);
    // No collectionSlug/variantId passed — no ordered context, so
    // "Следующее задание" must not silently jump anywhere.
    expect(screen.getByRole('button', { name: 'Следующее задание' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Следующее задание' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });

  it('navigates to the next task using the ordered variant context when known', async () => {
    const user = userEvent.setup();
    const nextTaskId = '33333333-3333-3333-3333-333333333333';
    vi.mocked(api.getVariant).mockResolvedValue({
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
      tasks: [
        { position: 1, task: taskWithSolution },
        { position: 2, task: { ...taskWithSolution, id: nextTaskId, taskNumber: 16 } },
      ],
    });
    render(
      <NavigationProvider>
        <ResultDesktop
          subjectId={baseTask.subjectId}
          taskNumber={baseTask.taskNumber}
          taskId={TASK_ID}
          correct
          userAnswer={CORRECT_ANSWER}
          variantId="variant-1"
        />
        <OverlayMarker />
      </NavigationProvider>,
    );
    await screen.findByText(EXPLANATION);
    const nextButton = await screen.findByRole('button', { name: 'Следующее задание' });
    expect(nextButton).toBeEnabled();
    await user.click(nextButton);
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});

describe('ResultDesktop — incorrect state', () => {
  it('shows a calm error banner with both answers and the solution toggle', async () => {
    renderResult(false);
    expect(await screen.findAllByText('Неверно')).not.toHaveLength(0);
    expect(screen.getByText('Правильный ответ:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Краткое решение' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подробное решение' })).toBeInTheDocument();
  });

  it('shows the "Полезно знать" hint tip', async () => {
    renderResult(false);
    expect(await screen.findByText('Полезно знать')).toBeInTheDocument();
  });
});

describe('ResultDesktop — multi_part task', () => {
  const multiPartTask = {
    ...baseTask,
    answerType: 'multi_part' as const,
    answerParts: [
      { id: 'a', label: 'а' },
      { id: 'b', label: 'б' },
      { id: 'c', label: 'в' },
    ],
    correctAnswer: serializeMultiPartSpec({
      parts: [
        { id: 'a', label: 'а', answerType: 'short_answer', correctAnswer: 'нет' },
        { id: 'b', label: 'б', answerType: 'short_answer', correctAnswer: '607' },
        { id: 'c', label: 'в', answerType: 'short_answer', correctAnswer: '1066' },
      ],
    }),
    explanationMd: '### А\nПояснение к а.\n\n### Б и В\nПояснение к б и в.',
    solutionSteps: null,
  };

  it('shows each part correct/incorrect with its own answer comparison and explanation section', async () => {
    const userAnswer = serializeMultiPartUserAnswer({ a: 'нет', b: '607', c: 'wrong' });
    vi.mocked(api.getTask).mockResolvedValue(multiPartTask);
    render(
      <NavigationProvider>
        <ResultDesktop
          subjectId={multiPartTask.subjectId}
          taskNumber={multiPartTask.taskNumber}
          taskId={TASK_ID}
          correct={false}
          userAnswer={userAnswer}
        />
        <OverlayMarker />
      </NavigationProvider>,
    );

    expect(await screen.findByText('а) Верно')).toBeInTheDocument();
    expect(screen.getByText('б) Верно')).toBeInTheDocument();
    expect(screen.getByText('в) Неверно')).toBeInTheDocument();
    expect(screen.getByText('Пояснение к а.')).toBeInTheDocument();
    expect(screen.getAllByText('Пояснение к б и в.')).toHaveLength(2);
    expect(screen.getByText('1066')).toBeInTheDocument();
  });
});

describe('ResultDesktop — "К списку заданий"', () => {
  it('goes to the Subject screen in "По номерам" mode, not Home, preserving the source', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getVariantForTask).mockResolvedValue({
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
      tasks: [{ position: 1, task: taskWithSolution }],
    });
    render(
      <NavigationProvider>
        <ResultDesktop
          subjectId={baseTask.subjectId}
          taskNumber={baseTask.taskNumber}
          taskId={TASK_ID}
          correct
          userAnswer={CORRECT_ANSWER}
          collectionSlug="ege-2026-yashchenko"
        />
        <OverlayMarker />
      </NavigationProvider>,
    );
    await screen.findByText(EXPLANATION);
    await user.click(screen.getByRole('button', { name: 'К списку заданий' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent(
      `subject:${baseTask.subjectId}:ege-2026-yashchenko:byNumber`,
    );
  });

  it('"Попробовать ещё раз" reopens the same task, not a plain back() to Home (audit Block 3)', async () => {
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <ResultDesktop
          subjectId={baseTask.subjectId}
          taskNumber={baseTask.taskNumber}
          taskId={TASK_ID}
          correct={false}
          userAnswer="неверный ответ"
        />
        <OverlayMarker />
      </NavigationProvider>,
    );
    await screen.findByText(EXPLANATION);
    await user.click(screen.getByRole('button', { name: 'Попробовать ещё раз' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});
