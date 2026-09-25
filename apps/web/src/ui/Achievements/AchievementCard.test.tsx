import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementCardDesktop } from './AchievementCardDesktop.js';
import { AchievementCardMobile } from './AchievementCardMobile.js';
import { achievements } from '../../data/sampleAchievements.js';

const unlocked = achievements.find((a) => a.unlocked)!;
const locked = achievements.find((a) => !a.unlocked)!;

describe('AchievementCardDesktop', () => {
  it('shows the unlock date when unlocked', () => {
    render(<AchievementCardDesktop achievement={unlocked} />);
    expect(screen.getByText(/Получено/)).toBeInTheDocument();
  });

  it('shows progress when locked', () => {
    render(<AchievementCardDesktop achievement={locked} />);
    expect(screen.getByText(`${locked.progress} / ${locked.target}`)).toBeInTheDocument();
  });
});

describe('AchievementCardMobile', () => {
  it('renders the achievement title and progress', () => {
    render(<AchievementCardMobile achievement={locked} />);
    expect(screen.getByText(locked.title)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      String(Math.round((locked.progress / locked.target) * 100)),
    );
  });
});
