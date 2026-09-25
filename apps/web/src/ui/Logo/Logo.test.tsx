import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo.js';

describe('Logo', () => {
  it('renders the wordmark as real text plus a decorative icon', () => {
    render(<Logo />);
    expect(screen.getByText('Zybr')).toBeInTheDocument();
    expect(screen.getByText('ilka')).toBeInTheDocument();
    // The wordmark already conveys "Zybrilka" accessibly, so the icon
    // next to it is decorative and must not repeat the same name.
    expect(screen.queryByRole('img', { name: 'Zybrilka' })).not.toBeInTheDocument();
  });

  it('uses the desktop icon crop by default and the mobile crop when requested', () => {
    const { rerender } = render(<Logo />);
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/branding/v2/logo-icon-desktop.png',
    );
    rerender(<Logo icon="mobile" />);
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/branding/v2/logo-icon-mobile.png',
    );
  });

  it('falls back to an accessible icon label when the wordmark is hidden', () => {
    render(<Logo wordmark={false} />);
    expect(screen.getByRole('img', { name: 'Zybrilka' })).toBeInTheDocument();
  });

  it('sizes the icon by the given size', () => {
    render(<Logo size={40} />);
    expect(document.querySelector('img')).toHaveAttribute('height', '40');
  });
});
