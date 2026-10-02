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
  getProgressByTaskNumber: vi.fn(() => new Promise(() => {})),
  getProgressByTopic: vi.fn(() => new Promise(() => {})),
  getTaskNumberStatisticsDetail: vi.fn(() => new Promise(() => {})),
  getMistakes: vi.fn(() => new Promise(() => {})),
  getLearningProfile: vi.fn(() => new Promise(() => {})),
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

function renderApp() {
  return render(
    <NavigationProvider>
      <AppMobile />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('AppMobile — bottom nav (matches profile_mobile_target.jpeg: Главная/Задания/Статистика/Достижения/Профиль)', () => {
  it('renders all five real nav slots', () => {
    renderApp();
    expect(screen.getByRole('button', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Задания' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Статистика' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Достижения' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Профиль' })).toBeInTheDocument();
  });

  it('"Задания" opens the real Training setup screen directly, not a WIP placeholder', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Задания' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeInTheDocument();
    });
  });

  it('"Профиль" opens the real Profile screen while keeping the bottom nav visible, Профиль highlighted', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Профиль' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('profile');
    const profileTab = screen.getByRole('button', { name: 'Профиль' });
    expect(profileTab).toHaveAttribute('aria-current', 'page');
    // The rest of the nav stays usable from inside Профиль — unlike
    // every other overlay, this one isn't a chrome-less takeover.
    expect(screen.getByRole('button', { name: 'Главная' })).toBeInTheDocument();
  });

  it('"Мои ошибки" stays reachable (Statistics\' own link), even though it is no longer a bottom-nav slot', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getProgressSummary).mockResolvedValue({
      solvedTotal: 0,
      correctTotal: 0,
      incorrectTotal: 0,
      accuracyPercent: 0,
      bySubject: [],
      byTaskNumber: [],
      byTopic: [],
      timeBySubject: [],
    });
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Статистика' }));
    const mistakesLink = await screen.findByRole('button', { name: /Анализ ошибок|Мои ошибки/ });
    await user.click(mistakesLink);
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('mistakes');
    });
  });
});

describe("AppMobile — menu (opened from Профиль's header button)", () => {
  it('opens the real Training setup screen from the menu, not a WIP placeholder', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([]);
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Профиль' }));
    await user.click(screen.getByRole('button', { name: 'Меню' }));
    await user.click(screen.getByRole('button', { name: 'Тренировка' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeInTheDocument();
    });
  });
});
