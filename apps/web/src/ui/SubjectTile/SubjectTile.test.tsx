import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubjectTile } from './SubjectTile.js';

describe('SubjectTile', () => {
  it('renders the literal pi glyph for math', () => {
    render(<SubjectTile glyph="pi" color="#22c55e" />);
    expect(screen.getByText('π')).toBeInTheDocument();
  });

  it('renders the literal Aa glyph for Russian', () => {
    render(<SubjectTile glyph="aa" color="#4da3ff" />);
    expect(screen.getByText('Aa')).toBeInTheDocument();
  });

  it('renders an icon for subjects without a text glyph', () => {
    const { container } = render(<SubjectTile glyph="globe" color="#a855f7" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
