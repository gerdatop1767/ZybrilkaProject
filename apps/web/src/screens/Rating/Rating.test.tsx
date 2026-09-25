import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingDesktop } from './RatingDesktop.js';
import { RatingMobile } from './RatingMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';
import { currentUserEntry, leaderboard } from '../../data/sampleLeaderboard.js';

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

describe('RatingDesktop', () => {
  it('shows the leader and the current user row', () => {
    renderWithNav(<RatingDesktop />);
    expect(screen.getAllByText(leaderboard[0]!.username).length).toBeGreaterThan(0);
    expect(screen.getByText('Текущая позиция')).toBeInTheDocument();
    expect(screen.getByText(`${currentUserEntry.rank} место`)).toBeInTheDocument();
  });

  it('shows a WIP note for the "По предметам" tab', async () => {
    const user = userEvent.setup();
    renderWithNav(<RatingDesktop />);
    await user.click(screen.getByRole('button', { name: 'По предметам' }));
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
  });
});

describe('RatingMobile', () => {
  it('renders the top-3 podium', () => {
    renderWithNav(<RatingMobile />);
    expect(screen.getByText(leaderboard[0]!.username)).toBeInTheDocument();
    expect(screen.getByText(leaderboard[1]!.username)).toBeInTheDocument();
    expect(screen.getByText(leaderboard[2]!.username)).toBeInTheDocument();
  });

  it('scales XP when switching period', async () => {
    const user = userEvent.setup();
    renderWithNav(<RatingMobile />);
    const weekXp = Math.round(leaderboard[0]!.xp * 0.15);
    expect(
      screen.getByText((_, el) => el?.textContent === `${weekXp.toLocaleString('ru-RU')} XP`),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'За всё время' }));
    expect(
      screen.getByText(
        (_, el) => el?.textContent === `${leaderboard[0]!.xp.toLocaleString('ru-RU')} XP`,
      ),
    ).toBeInTheDocument();
  });
});
