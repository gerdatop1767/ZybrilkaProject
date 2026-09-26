import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeDesktop } from './HomeDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay, tab } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? tab}</p>;
}

function renderHome() {
  return render(
    <NavigationProvider>
      <HomeDesktop />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('HomeDesktop', () => {
  it('renders the marketing headline, not the mobile dashboard greeting', () => {
    renderHome();
    expect(screen.getByText(/ЕГЭ становится проще/)).toBeInTheDocument();
    expect(screen.queryByText(/Готов к новой/)).not.toBeInTheDocument();
  });

  it('renders the feature bullets', () => {
    renderHome();
    expect(screen.getByText('предметов')).toBeInTheDocument();
    expect(screen.getByText('заданий')).toBeInTheDocument();
  });

  it('navigates to Учебный центр from the primary CTA', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /Начать бесплатно/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('learningCenter');
  });

  it('navigates to About from the secondary CTA', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /О проекте/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('about');
  });
});
