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

  it('shows the real completed/total count (never just the percent) when the row carries it', () => {
    render(
      <TaskNumberGrid
        rows={[{ number: 5, percent: 75, status: 'strong', completed: 3, total: 4 }]}
      />,
    );
    expect(screen.getByText('3 из 4')).toBeInTheDocument();
  });

  it('omits the count line in compact mode, keeping the dense card to number+percent+bar', () => {
    render(
      <TaskNumberGrid
        rows={[{ number: 5, percent: 75, status: 'strong', completed: 3, total: 4 }]}
        compact
      />,
    );
    expect(screen.queryByText('3 из 4')).not.toBeInTheDocument();
  });
});
