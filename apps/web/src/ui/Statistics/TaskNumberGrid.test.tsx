import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskNumberGrid } from './TaskNumberGrid.js';

const ROWS = [
  { number: 1, percent: 75, status: 'strong' as const },
  { number: 2, percent: null, status: 'untried' as const },
];

describe('TaskNumberGrid', () => {
  it('renders every number, its percent (or "Не решалось"), and calls onSelect when tapped', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TaskNumberGrid rows={ROWS} onSelect={onSelect} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Не решалось')).toBeInTheDocument();
    await user.click(screen.getByText('№1'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('compact mode keeps the same numbers/percents/bars/clickability, just denser', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<TaskNumberGrid rows={ROWS} onSelect={onSelect} compact />);
    expect(screen.getByText('№1')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    await user.click(screen.getByText('№2'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
