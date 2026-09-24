import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBand } from './HeroBand.js';

describe('HeroBand', () => {
  it('renders its children', () => {
    render(<HeroBand>Привет, Алексей!</HeroBand>);
    expect(screen.getByText('Привет, Алексей!')).toBeInTheDocument();
  });

  it('defaults to the brand tone', () => {
    const { container } = render(<HeroBand>content</HeroBand>);
    expect(container.firstElementChild?.className).toMatch(/brand/);
  });

  it('applies the requested tone', () => {
    const { container } = render(<HeroBand tone="success">content</HeroBand>);
    expect(container.firstElementChild?.className).toMatch(/success/);
  });
});
