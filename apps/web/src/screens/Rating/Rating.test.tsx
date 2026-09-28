import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingDesktop } from './RatingDesktop.js';
import { RatingMobile } from './RatingMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

describe('RatingDesktop', () => {
  it('shows a neutral WIP placeholder, never a fake leaderboard', () => {
    renderWithNav(<RatingDesktop />);
    expect(screen.getAllByText('Рейтинг').length).toBeGreaterThan(0);
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
    expect(screen.queryByText('Текущая позиция')).not.toBeInTheDocument();
  });
});

describe('RatingMobile', () => {
  it('shows a neutral WIP placeholder on the default "Общий" tab, never a fake podium', () => {
    renderWithNav(<RatingMobile />);
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
  });

  it('switching tabs still shows the matching WIP placeholder', async () => {
    const user = userEvent.setup();
    renderWithNav(<RatingMobile />);
    await user.click(screen.getByRole('tab', { name: 'Друзья' }));
    expect(screen.getAllByText('Друзья').length).toBeGreaterThan(0);
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
  });
});
