import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo.js';

describe('Logo', () => {
  it('renders the approved logo asset with accessible alt text', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: 'Zybrilka' });
    expect(img).toHaveAttribute('src', '/branding/zybrilka-logo.png');
  });

  it('sizes by height only, preserving the asset’s own aspect ratio', () => {
    render(<Logo size={40} />);
    const img = screen.getByRole('img', { name: 'Zybrilka' });
    expect(img).toHaveAttribute('height', '40');
    expect(img).not.toHaveAttribute('width');
  });
});
