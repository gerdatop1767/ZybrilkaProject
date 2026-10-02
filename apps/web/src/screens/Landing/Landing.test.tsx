import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingDesktop } from './LandingDesktop.js';
import { LandingMobile } from './LandingMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay, tab } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? `tab:${tab}`}</p>;
}

function renderWithNav(ui: React.ReactElement) {
  return render(
    <NavigationProvider>
      {ui}
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('LandingDesktop', () => {
  it('renders the marketing headline, mascot, and both CTAs', () => {
    renderWithNav(<LandingDesktop />);
    expect(screen.getByText(/ЕГЭ становится проще/)).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute('src', '/branding/v2/hero-mascot-desktop.webp');
    expect(screen.getByRole('button', { name: /Начать бесплатно/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /О проекте/ })).toBeInTheDocument();
  });

  it('"Начать бесплатно" opens onboarding', async () => {
    const user = userEvent.setup();
    renderWithNav(<LandingDesktop />);
    await user.click(screen.getByRole('button', { name: /Начать бесплатно/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('onboarding');
  });

  it('"О проекте" opens the About overlay', async () => {
    const user = userEvent.setup();
    renderWithNav(<LandingDesktop />);
    await user.click(screen.getByRole('button', { name: /О проекте/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('about');
  });
});

describe('LandingMobile', () => {
  it('renders the same headline, mascot, and both CTAs as desktop (same copy, mobile layout)', () => {
    renderWithNav(<LandingMobile />);
    expect(screen.getByText(/ЕГЭ становится проще/)).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute('src', '/branding/v2/hero-mascot-desktop.webp');
    expect(screen.getByRole('button', { name: /Начать бесплатно/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /О проекте/ })).toBeInTheDocument();
  });

  it('"Начать бесплатно" opens onboarding', async () => {
    const user = userEvent.setup();
    renderWithNav(<LandingMobile />);
    await user.click(screen.getByRole('button', { name: /Начать бесплатно/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('onboarding');
  });

  it('"О проекте" opens the About overlay', async () => {
    const user = userEvent.setup();
    renderWithNav(<LandingMobile />);
    await user.click(screen.getByRole('button', { name: /О проекте/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('about');
  });
});
