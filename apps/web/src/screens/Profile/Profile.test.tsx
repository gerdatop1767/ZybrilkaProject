import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profile } from './Profile.js';
import { userStats } from '../../data/sampleProgress.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { ToastProvider } from '../../ui/Toast/ToastProvider.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderProfile() {
  return render(
    <NavigationProvider>
      <ToastProvider>
        <Profile />
        <OverlayMarker />
      </ToastProvider>
    </NavigationProvider>,
  );
}

describe('Profile', () => {
  it('renders identity, level and streak', () => {
    renderProfile();
    expect(screen.getByText(userStats.name)).toBeInTheDocument();
    expect(screen.getByText(`Уровень ${userStats.level}`)).toBeInTheDocument();
  });

  it('animates XP up to its final value', async () => {
    renderProfile();
    await waitFor(
      () => {
        expect(screen.getByText(String(userStats.xp))).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('renders the achievements preview', () => {
    renderProfile();
    expect(screen.getByText('Достижения')).toBeInTheDocument();
  });

  it('shows an achievement toast when tapping an unlocked achievement', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: /100 решено/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Достижение получено: 100 решено');
  });

  it('navigates to onboarding from the settings entry point', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: /Пройти диагностику заново/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('onboarding');
  });
});
