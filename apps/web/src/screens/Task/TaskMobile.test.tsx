import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskMobile } from './TaskMobile.js';
import { sampleTask } from '../../data/sampleTask.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

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
        subjectId={sampleTask.subjectId}
        taskNumber={sampleTask.number}
        taskId={sampleTask.id}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

/** userEvent.type() parses [ ] { } as key-modifier syntax, so answers
 * like "(−∞; −1] ∪ [2; +∞)" must be pasted in, not typed. */
async function pasteAnswer(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByLabelText('Ответ');
  await user.click(input);
  await user.paste(text);
}

describe('TaskMobile', () => {
  it('renders the task condition and code', () => {
    renderTask();
    expect(screen.getByText(sampleTask.condition)).toBeInTheDocument();
    expect(screen.getByText(sampleTask.code, { exact: false })).toBeInTheDocument();
  });

  it('renders the tools panel collapsed by default (04b variant)', () => {
    renderTask();
    expect(screen.getByRole('button', { name: /Дополнительные инструменты/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Кальк.' })).not.toBeInTheDocument();
  });

  it('expands the tools panel to reveal the 5 tools', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.click(screen.getByRole('button', { name: /Дополнительные инструменты/ }));
    expect(screen.getByRole('button', { name: 'Кальк.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Полотно' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Шаблоны' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Справочник' })).toBeInTheDocument();
  });

  it('renders "Другие задания" collapsed by default with real task codes', async () => {
    const user = userEvent.setup();
    renderTask();
    expect(screen.queryByRole('button', { name: /#3215/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Другие задания/ }));
    expect(screen.getByRole('button', { name: /#3215/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /#3216/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /#3217/ })).toBeInTheDocument();
  });

  it('disables Проверить until an answer is entered', async () => {
    const user = userEvent.setup();
    renderTask();
    const submit = screen.getByRole('button', { name: /Проверить ответ/ });
    expect(submit).toBeDisabled();
    await pasteAnswer(user, sampleTask.correctAnswer);
    expect(submit).toBeEnabled();
  });

  it('shows a checking state then navigates to a correct Result', async () => {
    const user = userEvent.setup();
    renderTask();
    await pasteAnswer(user, sampleTask.correctAnswer);
    const submit = screen.getByRole('button', { name: /Проверить ответ/ });
    await user.click(submit);
    expect(submit).toBeDisabled();
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
    const toggle = screen.getByRole('button', { name: 'Подсказка' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(sampleTask.hint)).toBeInTheDocument();
  });

  it('inserts a math symbol into the answer field via the fx toggle', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.click(screen.getByRole('button', { name: 'Математические символы' }));
    await user.click(screen.getByRole('button', { name: '∞' }));
    expect(screen.getByLabelText('Ответ')).toHaveValue('∞');
  });

  it('calls back() from the header back button', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });
});
