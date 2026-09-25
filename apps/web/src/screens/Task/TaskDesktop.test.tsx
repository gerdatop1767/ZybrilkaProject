import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDesktop } from './TaskDesktop.js';
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
      <TaskDesktop
        subjectId={sampleTask.subjectId}
        taskNumber={sampleTask.number}
        taskId={sampleTask.id}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

async function pasteAnswer(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByLabelText('Ответ');
  await user.click(input);
  await user.paste(text);
}

describe('TaskDesktop', () => {
  it('renders the breadcrumb and condition', () => {
    renderTask();
    expect(screen.getByText(sampleTask.condition)).toBeInTheDocument();
    expect(screen.getByText(sampleTask.subjectName, { exact: false })).toBeInTheDocument();
  });

  it('renders the session progress ring and other-tasks sidebar', () => {
    renderTask();
    expect(screen.getByText('Прогресс в теме')).toBeInTheDocument();
    expect(screen.getByText('Другие задания')).toBeInTheDocument();
    expect(screen.getByText('Инструменты')).toBeInTheDocument();
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
    await pasteAnswer(user, 'неверный ответ');
    await user.click(screen.getByRole('button', { name: /Проверить ответ/ }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('result:incorrect');
    });
  });

  it('toggles the hint', async () => {
    const user = userEvent.setup();
    renderTask();
    const toggle = screen.getByRole('button', { name: 'Показать подсказку' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByText(sampleTask.hint)).toBeInTheDocument();
  });

  it('calls back() from the breadcrumb back button', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });
});
