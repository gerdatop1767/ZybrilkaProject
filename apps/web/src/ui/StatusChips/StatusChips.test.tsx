import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChips } from './StatusChips.js';
import { userStats } from '../../data/sampleProgress.js';

describe('StatusChips', () => {
  it('renders the real streak/level badge illustrations', () => {
    render(<StatusChips />);
    expect(document.querySelector('img[src="/branding/v2/badges/flame.png"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="/branding/v2/badges/crown.png"]')).toBeInTheDocument();
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
