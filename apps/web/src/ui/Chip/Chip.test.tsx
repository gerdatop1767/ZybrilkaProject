import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip.js';

describe('Chip', () => {
  it('renders unselected by default', () => {
    render(<Chip>Математика</Chip>);
    expect(screen.getByRole('button', { name: 'Математика' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reflects the selected state', () => {
    render(<Chip selected>Математика</Chip>);
    expect(screen.getByRole('button', { name: 'Математика' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('calls onClick when tapped', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Сложность 2</Chip>);
    await user.click(screen.getByRole('button', { name: 'Сложность 2' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
