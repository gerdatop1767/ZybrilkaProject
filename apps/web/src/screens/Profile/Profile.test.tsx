import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profile } from './Profile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { ToastProvider } from '../../ui/Toast/ToastProvider.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getProgressSummary: vi.fn(),
}));

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

beforeEach(() => {
  vi.mocked(api.getProgressSummary).mockResolvedValue({
    solvedTotal: 0,
    correctTotal: 0,
    incorrectTotal: 0,
    accuracyPercent: 0,
    bySubject: [],
    byTaskNumber: [],
    byTopic: [],
  });
});

describe('Profile', () => {
  it('shows 0/0% before real progress data has loaded, never a fabricated fallback', () => {
    renderProfile();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders real solved/accuracy numbers from /progress/summary', async () => {
    vi.mocked(api.getProgressSummary).mockResolvedValue({
      solvedTotal: 42,
      correctTotal: 30,
      incorrectTotal: 12,
      accuracyPercent: 71,
      bySubject: [],
      byTaskNumber: [],
      byTopic: [],
    });
    renderProfile();
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('shows a neutral placeholder for achievements, never fake unlock data', () => {
    renderProfile();
    expect(screen.getByText('Достижения')).toBeInTheDocument();
    expect(screen.getByText('Достижения скоро появятся здесь.')).toBeInTheDocument();
  });

  it('navigates to onboarding from the settings entry point', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: /Пройти диагностику заново/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('onboarding');
  });
});
