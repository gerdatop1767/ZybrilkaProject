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
  it('renders the Zybrilka brand and greeting', () => {
    renderHome();
    expect(screen.getByText('Zybrilka')).toBeInTheDocument();
    expect(screen.getByText(/Привет,/)).toBeInTheDocument();
  });

  it('renders subject chips and recent activity', () => {
    renderHome();
    expect(screen.getByText(/Математика/)).toBeInTheDocument();
    expect(screen.getByText('Недавняя активность')).toBeInTheDocument();
  });

  it('exposes a mascot in the greeting area', () => {
    renderHome();
    expect(screen.getByRole('img', { name: 'Zybrilka' })).toHaveAttribute(
      'data-mascot-pose',
      'greeting',
    );
  });

  it('navigates to the task screen from the primary CTA', async () => {
    const user = userEvent.setup();
    renderHome();
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
    await user.click(screen.getByRole('button', { name: 'Продолжить тренировку' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});
