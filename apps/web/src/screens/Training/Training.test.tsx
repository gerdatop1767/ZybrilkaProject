import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Training } from './Training.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderTraining() {
  return render(
    <NavigationProvider>
      <Training />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

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

  it('navigates to the task screen on start', async () => {
    const user = userEvent.setup();
    renderTraining();
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});
