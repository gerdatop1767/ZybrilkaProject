import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Task } from './Task.js';
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
      <Task taskId={sampleTask.id} />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('Task', () => {
  it('renders the task condition', () => {
    renderTask();
    expect(screen.getByText(sampleTask.condition)).toBeInTheDocument();
  });

  it('disables Проверить until an answer is entered', async () => {
    const user = userEvent.setup();
    renderTask();
    const submit = screen.getByRole('button', { name: 'Проверить' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Ответ'), sampleTask.correctAnswer);
    expect(submit).toBeEnabled();
  });

  it('navigates to a correct Result for the right answer', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.type(screen.getByLabelText('Ответ'), sampleTask.correctAnswer);
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('result:correct');
  });

  it('navigates to an incorrect Result for the wrong answer', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.type(screen.getByLabelText('Ответ'), '999999');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('result:incorrect');
  });

  it('opens the scratchboard entry point', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.click(screen.getByRole('button', { name: /Расширить поле/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls back() from the header back button', async () => {
    const user = userEvent.setup();
    renderTask();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });
});
