import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { serializeMultiPartSpec, serializeMultiPartUserAnswer } from '@zybrilka/shared';
import { ResultMobile } from './ResultMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { userStats } from '../../data/sampleProgress.js';
import { getStreakAsset } from '../../lib/rank.js';
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
const TASK_NUMBER = 15;

const baseTask = {
  id: TASK_ID,
  subjectId: 'math',
  taskNumber: TASK_NUMBER,
  topicId: null,
  topicName: 'Логарифмы',
  difficulty: 3 as const,
  conditionMd: CONDITION,
  imageUrl: null,
  hintMd: null,
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
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderResult(correct: boolean, userAnswer = correct ? CORRECT_ANSWER : '(−∞; 2]') {
  return render(
    <NavigationProvider>
      <ResultMobile
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

describe('ResultMobile — correct state', () => {
  it('shows the success feedback and the matched answer', async () => {
    renderResult(true);
    expect(await screen.findByText('Правильно!')).toBeInTheDocument();
    expect(screen.getAllByText(CORRECT_ANSWER).length).toBeGreaterThan(0);
  });

  it('does not show the reference-answer row when correct', async () => {
    renderResult(true);
    await screen.findByText('Правильно!');
    expect(screen.queryByText('Правильный ответ:')).not.toBeInTheDocument();
  });

  it('reveals the solution explanation', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await screen.findByText('Правильно!');
    await user.click(screen.getByRole('button', { name: /Показать решение/ }));
    expect(screen.getByText(EXPLANATION)).toBeInTheDocument();
  });

  it('has no ordered context without a collection/variant, so "Следующее задание" stays inert', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await screen.findByText('Правильно!');
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
        <ResultMobile
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
    await screen.findByText('Правильно!');
    const nextButton = await screen.findByRole('button', { name: 'Следующее задание' });
    expect(nextButton).toBeEnabled();
    await user.click(nextButton);
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});

describe('ResultMobile — incorrect state', () => {
  it('shows a calm error state with the correct answer', async () => {
    renderResult(false);
    expect(await screen.findByText('Неправильно!')).toBeInTheDocument();
    expect(screen.getByText('Правильный ответ:')).toBeInTheDocument();
    expect(screen.getAllByText(CORRECT_ANSWER).length).toBeGreaterThan(0);
  });

  it('shows the task number via the meta chip on the task chrome', async () => {
    renderResult(false);
    expect(await screen.findByText(`Задание №${TASK_NUMBER}`)).toBeInTheDocument();
  });
});

describe('ResultMobile — badges', () => {
  it('uses the shared StreakBadge PNG for the streak stat, never an emoji', async () => {
    renderResult(true);
    await screen.findByText('Правильно!');
    expect(
      document.querySelector(`img[src="${getStreakAsset(userStats.streakDays)}"]`),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/🔥/);
  });
});

describe('ResultMobile — multi_part task', () => {
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

  it('shows per-part answer rows and per-part explanation once revealed', async () => {
    const user = userEvent.setup();
    const userAnswer = serializeMultiPartUserAnswer({ a: 'нет', b: '607', c: 'wrong' });
    vi.mocked(api.getTask).mockResolvedValue(multiPartTask);
    render(
      <NavigationProvider>
        <ResultMobile
          subjectId={multiPartTask.subjectId}
          taskNumber={multiPartTask.taskNumber}
          taskId={TASK_ID}
          correct={false}
          userAnswer={userAnswer}
        />
        <OverlayMarker />
      </NavigationProvider>,
    );

    await screen.findByText('Неправильно!');
    expect(screen.getByText('а) Твой ответ:')).toBeInTheDocument();
    expect(screen.getByText('1066')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Показать решение/ }));
    expect(screen.getByText('Пояснение к а.')).toBeInTheDocument();
    expect(screen.getAllByText('Пояснение к б и в.')).toHaveLength(2);
  });
});

describe('ResultMobile — shared chrome', () => {
  it('keeps tools and other-variants collapsed by default', async () => {
    renderResult(true);
    await screen.findByText('Правильно!');
    expect(screen.getByRole('button', { name: /Дополнительные инструменты/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /Другие задания/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
