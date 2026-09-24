import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileShell } from './MobileShell.js';

describe('MobileShell', () => {
  it('renders the brand header with the logo when a nav is provided', () => {
    render(
      <MobileShell nav={<span>nav</span>}>
        <p>Content</p>
      </MobileShell>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Zybrilka' })).toBeInTheDocument();
  });

  it('omits the brand header and the nav wrapper when no nav is given (overlay screens)', () => {
    const { container } = render(
      <MobileShell>
        <p>Overlay content</p>
      </MobileShell>,
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Zybrilka' })).not.toBeInTheDocument();
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('renders the nav and children together', () => {
    render(
      <MobileShell nav={<nav aria-label="test-nav">nav</nav>}>
        <p>Screen content</p>
      </MobileShell>,
    );
    expect(screen.getByLabelText('test-nav')).toBeInTheDocument();
    expect(screen.getByText('Screen content')).toBeInTheDocument();
  });
});
