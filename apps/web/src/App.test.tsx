import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.js';
import { NavigationProvider } from './lib/navigation.js';
import { ToastProvider } from './ui/Toast/ToastProvider.js';
import { sampleTask } from './data/sampleTask.js';

function renderApp() {
  return render(
    <NavigationProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </NavigationProvider>,
  );
}

describe('App', () => {
  it('renders Home first, with the bottom navigation visible', () => {
    renderApp();
    expect(screen.getByText('Zybrilka')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Главная/ })).toHaveAttribute('aria-current', 'page');
  });

  it('switches tabs via the bottom navigation', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Прогресс/ }));
    expect(screen.getByRole('heading', { name: 'Прогресс' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Прогресс/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: /Главная/ })).not.toHaveAttribute('aria-current');
  });

  it('hides the bottom navigation on the Task overlay and shows it again after Result', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Продолжить тренировку' }));
    expect(screen.queryByRole('button', { name: /Главная/ })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Ответ'), sampleTask.correctAnswer);
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(screen.getByText('Правильно!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Главная/ })).not.toBeInTheDocument();
  });

  it('renders a coming-soon placeholder for the Battles tab', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Битвы/ }));
    expect(screen.getByText('Битвы скоро здесь')).toBeInTheDocument();
  });

  it('reaches onboarding from Profile and returns to Home tab on finish', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Профиль/ }));
    await user.click(screen.getByRole('button', { name: /Пройти диагностику заново/ }));
    expect(screen.getByText('Добро пожаловать в Zybrilka!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Главная/ })).not.toBeInTheDocument();
  });
});
