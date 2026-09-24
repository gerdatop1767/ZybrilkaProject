import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar.js';
import { CircularProgress } from './CircularProgress.js';

describe('ProgressBar', () => {
  it('renders the given value', () => {
    render(<ProgressBar value={64} label="Точность" />);
    const bar = screen.getByRole('progressbar', { name: 'Точность' });
    expect(bar).toHaveAttribute('aria-valuenow', '64');
  });

  it('clamps out-of-range values', () => {
    render(<ProgressBar value={140} label="Прогресс" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('omits aria-valuenow while indeterminate', () => {
    render(<ProgressBar indeterminate label="Загрузка" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });
});

describe('CircularProgress', () => {
  it('renders the given value', () => {
    render(<CircularProgress value={82} label="Производные" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '82');
  });

  it('renders centered content', () => {
    render(
      <CircularProgress value={82} label="Производные">
        82%
      </CircularProgress>,
    );
    expect(screen.getByText('82%')).toBeInTheDocument();
  });
});
