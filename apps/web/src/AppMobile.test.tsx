import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppMobile } from './AppMobile.js';
import { NavigationProvider, useNavigation } from './lib/navigation.js';
import * as api from './lib/api.js';

vi.mock('./lib/api.js', () => ({
  getRandomTask: vi.fn(),
  getTask: vi.fn(),
  listTasksByNumber: vi.fn(),
  getProgressSummary: vi.fn(() => new Promise(() => {})),
  getMistakes: vi.fn(() => new Promise(() => {})),
  listFavoriteTaskIds: vi.fn(() => Promise.resolve({ taskIds: [] })),
  addFavorite: vi.fn(() => Promise.resolve()),
  removeFavorite: vi.fn(() => Promise.resolve()),
  listCollections: vi.fn(() => Promise.resolve([])),
  getVariant: vi.fn(),
  startLearningSession: vi.fn(),
  getLearningSessionNext: vi.fn(),
  getLearningSession: vi.fn(),
}));

function OverlayMarker() {
  const { overlay } = useNavigation();
  if (overlay?.screen === 'task') {
    return <p data-testid="overlay">task:{overlay.taskNumber}</p>;
  }
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

describe('AppMobile — bottom nav "Мои ошибки" slot', () => {
  it('opens the real Mistakes screen, not a WIP training tab', async () => {
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <AppMobile />
        <OverlayMarker />
      </NavigationProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Мои ошибки' }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('mistakes');
    });
  });
});

describe('AppMobile — menu "Тренировка" item', () => {
  it('opens the real Training setup screen, not a WIP placeholder (Phase 10: reachable on mobile)', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([]);
    render(
      <NavigationProvider>
        <AppMobile />
      </NavigationProvider>,
    );

    // Training no longer has a bottom-nav shortcut (that slot is now
    // "Мои ошибки" — audit Block 2), but it stays reachable from the
    // menu, opened via the bottom nav's "Профиль" slot.
    await user.click(screen.getByRole('button', { name: 'Профиль' }));
    await user.click(screen.getByRole('button', { name: 'Тренировка' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeInTheDocument();
    });
  });
});
