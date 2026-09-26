import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChips } from './StatusChips.js';
import { userStats } from '../../data/sampleProgress.js';
import { getStreakAsset, getLevelAsset } from '../../lib/rank.js';

describe('StatusChips', () => {
  it('renders the streak/level badges from the shared rank system, not emoji', () => {
    render(<StatusChips />);
    expect(
      document.querySelector(`img[src="${getStreakAsset(userStats.streakDays)}"]`),
    ).toBeInTheDocument();
    expect(
      document.querySelector(`img[src="${getLevelAsset(userStats.level)}"]`),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/🔥|👑/);
  });

  it('keeps the streak days and level dynamic, not baked into the image', () => {
    render(<StatusChips />);
    expect(screen.getByText(`${userStats.streakDays} дней`)).toBeInTheDocument();
    expect(screen.getByText(String(userStats.level))).toBeInTheDocument();
  });

  it('keeps a real, dynamic progress bar for the level', () => {
    render(<StatusChips />);
    const expectedPercent = Math.round((userStats.xp / userStats.xpToNextLevel) * 100);
    const fill = document.querySelector('[class*="levelBarFill"]') as HTMLElement | null;
    expect(fill).toBeInTheDocument();
    expect(fill!.style.width).toBe(`${expectedPercent}%`);
  });
});
