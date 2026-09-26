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
  answerType: 'short_answer' as const,
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

function OverlayMarker() {
  const { overlay } = useNavigation();
  if (overlay?.screen === 'result') {
    return <p data-testid="overlay">result:{overlay.correct ? 'correct' : 'incorrect'}</p>;
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
        answer.trim() === CORRECT_ANSWER
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
});
