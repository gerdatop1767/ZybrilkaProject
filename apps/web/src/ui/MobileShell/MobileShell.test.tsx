import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileShell } from './MobileShell.js';
import { NavigationProvider } from '../../lib/navigation.js';

describe('MobileShell', () => {
  it('renders the header with logo and status chips when a nav is provided', () => {
    render(
      <NavigationProvider>
        <MobileShell nav={<span>nav</span>}>
          <p>Content</p>
        </MobileShell>
      </NavigationProvider>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Zybr')).toBeInTheDocument();
    expect(screen.getByText(/Серия/)).toBeInTheDocument();
  });

  it('omits the header and the nav wrapper when no nav is given (overlay screens)', () => {
    const { container } = render(
      <NavigationProvider>
        <MobileShell>
          <p>Overlay content</p>
        </MobileShell>
      </NavigationProvider>,
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByText('Zybr')).not.toBeInTheDocument();
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('renders the nav and children together', () => {
    render(
      <NavigationProvider>
        <MobileShell nav={<nav aria-label="test-nav">nav</nav>}>
          <p>Screen content</p>
        </MobileShell>
      </NavigationProvider>,
    );
    expect(screen.getByLabelText('test-nav')).toBeInTheDocument();
    expect(screen.getByText('Screen content')).toBeInTheDocument();
  });
});
