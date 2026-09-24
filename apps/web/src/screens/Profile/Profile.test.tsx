import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profile } from './Profile.js';
import { userStats } from '../../data/sampleProgress.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderProfile() {
  return render(
    <NavigationProvider>
      <Profile />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('Profile', () => {
  it('renders identity, level and streak', () => {
    renderProfile();
    expect(screen.getByText(userStats.name)).toBeInTheDocument();
    expect(screen.getByText(`Уровень ${userStats.level}`)).toBeInTheDocument();
  });

  it('renders the achievements preview', () => {
    renderProfile();
    expect(screen.getByText('Достижения')).toBeInTheDocument();
  });

  it('navigates to onboarding from the settings entry point', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: /Пройти диагностику заново/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('onboarding');
  });
});
