import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { ToastProvider } from '../../ui/Toast/ToastProvider.js';

/** Renders the current overlay screen name so navigation can be asserted on. */
function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderHome() {
  return render(
    <NavigationProvider>
      <ToastProvider>
        <Home />
        <OverlayMarker />
      </ToastProvider>
    </NavigationProvider>,
  );
}

describe('Home', () => {
  it('renders the greeting and streak', () => {
    renderHome();
    expect(screen.getByText(/Привет,/)).toBeInTheDocument();
    // The streak count appears both in the hero and in the progress StatRow.
    expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(2);
  });

  it('renders subject mastery and recent activity', () => {
    renderHome();
    expect(screen.getByText('Математика')).toBeInTheDocument();
    expect(screen.getByText('Логарифмы')).toBeInTheDocument();
    expect(screen.getByText('Весь прогресс')).toBeInTheDocument();
  });

  it('does not render a mascot placeholder', () => {
    renderHome();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('navigates to the task screen from the primary CTA', async () => {
    const user = userEvent.setup();
    renderHome();
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
    await user.click(screen.getByRole('button', { name: 'Продолжить тренировку' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });

  it('animates the XP total up to its final value', async () => {
    renderHome();
    await waitFor(
      () => {
        expect(screen.getByText('642')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('shows an achievement toast when tapping an unlocked achievement', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /7 дней подряд/ }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Достижение получено: 7 дней подряд',
    );
  });

  it('does not make a locked achievement interactive', () => {
    renderHome();
    expect(screen.queryByRole('button', { name: /Точность 85%/ })).not.toBeInTheDocument();
    expect(screen.getByText('Точность 85%')).toBeInTheDocument();
  });
});
