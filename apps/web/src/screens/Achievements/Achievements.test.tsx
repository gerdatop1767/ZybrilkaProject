import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementsDesktop } from './AchievementsDesktop.js';
import { AchievementsMobile } from './AchievementsMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

describe('AchievementsDesktop', () => {
  it('shows a neutral WIP placeholder, never fake unlock/progress data', () => {
    renderWithNav(<AchievementsDesktop />);
    expect(screen.getAllByText('Достижения').length).toBeGreaterThan(0);
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
  });
});

describe('AchievementsMobile', () => {
  it('shows a neutral WIP placeholder, never fake level/XP/streak or unlock data', () => {
    renderWithNav(<AchievementsMobile />);
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
    expect(screen.queryByText('уровень')).not.toBeInTheDocument();
  });
});
