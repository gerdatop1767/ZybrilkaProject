import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileShell } from './MobileShell.js';

describe('MobileShell', () => {
  it('reserves extra bottom padding for the scrollable content when a nav is provided', () => {
    const { container: withNav } = render(
      <MobileShell nav={<span>nav</span>}>
        <p>Content</p>
      </MobileShell>,
    );
    const { container: withoutNav } = render(
      <MobileShell>
        <p>Content</p>
      </MobileShell>,
    );

    const mainWithNav = withNav.querySelector('main');
    const mainWithoutNav = withoutNav.querySelector('main');
    expect(mainWithNav).not.toBeNull();
    expect(mainWithoutNav).not.toBeNull();

    // With a nav, the content gets an additional class reserving room
    // for BottomNav's height + safe area, on top of the base padding
    // class every screen gets — so it must carry strictly more classes
    // than a screen with no nav, never fewer or the same.
    const withNavClassCount = mainWithNav!.className.split(' ').filter(Boolean).length;
    const withoutNavClassCount = mainWithoutNav!.className.split(' ').filter(Boolean).length;
    expect(withNavClassCount).toBeGreaterThan(withoutNavClassCount);
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

  it('omits the nav wrapper entirely when no nav is given (overlay screens)', () => {
    const { container } = render(
      <MobileShell>
        <p>Overlay content</p>
      </MobileShell>,
    );
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });
});
