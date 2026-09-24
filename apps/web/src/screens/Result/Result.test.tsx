import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Result } from './Result.js';
import { sampleTask } from '../../data/sampleTask.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderResult(correct: boolean) {
  return render(
    <NavigationProvider>
      <Result taskId={sampleTask.id} correct={correct} />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('Result — correct state', () => {
  it('shows the success feedback and XP', () => {
    renderResult(true);
    expect(screen.getByText('Правильно!')).toBeInTheDocument();
    expect(screen.getByText('+15 XP')).toBeInTheDocument();
  });

  it('shows the explanation and topic', () => {
    renderResult(true);
    expect(screen.getByText(sampleTask.explanation)).toBeInTheDocument();
    expect(screen.getByText(`Тема: ${sampleTask.topic}`)).toBeInTheDocument();
  });

  it('does not show a hint or "Похожее задание" when correct', () => {
    renderResult(true);
    expect(screen.queryByText(/Подсказка/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Похожее задание' })).not.toBeInTheDocument();
  });

  it('advances to the next task', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await user.click(screen.getByRole('button', { name: 'Следующее задание' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});

describe('Result — incorrect state', () => {
  it('shows a calm, non-aggressive error state with the correct answer', () => {
    renderResult(false);
    expect(screen.getByText('Неверно')).toBeInTheDocument();
    expect(screen.getByText(`Правильный ответ: ${sampleTask.correctAnswer}`)).toBeInTheDocument();
  });

  it('shows a hint and a "Похожее задание" option', () => {
    renderResult(false);
    expect(screen.getByText(/Подсказка/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Похожее задание' })).toBeInTheDocument();
  });

  it('does not render a mascot placeholder', () => {
    renderResult(false);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
