import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementsDesktop } from './AchievementsDesktop.js';
import { AchievementsMobile } from './AchievementsMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';
import { achievements } from '../../data/sampleAchievements.js';

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

describe('AchievementsDesktop', () => {
  it('shows the total achievement count in the "Все" filter', () => {
    renderWithNav(<AchievementsDesktop />);
    expect(
      screen.getByRole('button', { name: new RegExp(`Все ${achievements.length}`) }),
    ).toBeInTheDocument();
  });

  it('filters to a single category when its chip is clicked', async () => {
    const user = userEvent.setup();
    renderWithNav(<AchievementsDesktop />);
    const mathCount = achievements.filter((a) => a.category === 'math').length;
    await user.click(screen.getByRole('button', { name: new RegExp(`Математика ${mathCount}`) }));
    expect(screen.getAllByText('Математик').length).toBeGreaterThan(0);
  });
});

describe('AchievementsMobile', () => {
  it('renders the level card and achievement grid', () => {
    renderWithNav(<AchievementsMobile />);
    expect(screen.getByText('уровень')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Мои достижения (' +
          achievements.filter((a) => a.unlocked).length +
          '/' +
          achievements.length +
          ')',
      ),
    ).toBeInTheDocument();
  });

  it('switches sub-tabs to show only streak achievements', async () => {
    const user = userEvent.setup();
    renderWithNav(<AchievementsMobile />);
    await user.click(screen.getByRole('tab', { name: 'Серия' }));
    expect(screen.getByText('Серия 7 дней')).toBeInTheDocument();
    expect(screen.queryByText('Полиглот')).not.toBeInTheDocument();
  });
});
