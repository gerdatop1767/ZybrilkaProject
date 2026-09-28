import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChips } from './StatusChips.js';

describe('StatusChips', () => {
  it('shows a neutral dash for streak/level, never a fabricated number or emoji', () => {
    render(<StatusChips />);
    expect(screen.getByText('Серия')).toBeInTheDocument();
    expect(screen.getByText('Уровень')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/🔥|👑/);
  });

  it('never renders StreakBadge/LevelBadge images, since no real day/level count backs them', () => {
    render(<StatusChips />);
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });
});
