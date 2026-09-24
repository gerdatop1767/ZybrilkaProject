import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Mascot } from './Mascot.js';

describe('Mascot', () => {
  it('renders as a labeled image placeholder', () => {
    render(<Mascot pose="greeting" />);
    expect(screen.getByRole('img', { name: 'Zybrilka' })).toBeInTheDocument();
  });

  it('exposes the requested pose for later asset wiring', () => {
    render(<Mascot pose="celebrating" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-mascot-pose', 'celebrating');
  });
});
