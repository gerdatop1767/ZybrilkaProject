import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

/** Renders the current overlay screen name so navigation can be asserted on. */
function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderHome() {
  return render(
    <NavigationProvider>
      <Home />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('Home', () => {
  it('renders the greeting and streak', () => {
    renderHome();
    expect(screen.getByText(/Привет,/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders subject chips and recent activity', () => {
    renderHome();
    expect(screen.getByText(/Математика/)).toBeInTheDocument();
    expect(screen.getByText('Недавняя активность')).toBeInTheDocument();
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
});
