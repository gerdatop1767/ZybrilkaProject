import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.js';
import { NavigationProvider } from './lib/navigation.js';
import { ToastProvider } from './ui/Toast/ToastProvider.js';

function renderApp() {
  return render(
    <NavigationProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </NavigationProvider>,
  );
}

/** Forces useIsDesktop() to a fixed value for one test. */
function mockDesktop(matches: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe('App — mobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the mobile Home with the bottom tab bar visible', () => {
    renderApp();
    expect(screen.getByText(/Готов к новой/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Главная/ })).toHaveAttribute('aria-current', 'page');
  });

  it('switches tabs via the bottom navigation', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Статистика/ }));
    expect(screen.getByRole('button', { name: 'Статистика' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens the Menu drawer from the bottom navigation "Профиль" slot', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Профиль/ }));
    expect(screen.getByRole('dialog', { name: 'Меню' })).toBeInTheDocument();
    expect(screen.getByText('Зубрилка')).toBeInTheDocument();
  });

  it('hides the tab bar on an overlay screen', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Тренировка · 15 заданий/ }));
    expect(screen.queryByRole('button', { name: /Главная/ })).not.toBeInTheDocument();
  });
});

describe('App — desktop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the desktop marketing Home without a sidebar', () => {
    const restore = mockDesktop(true);
    renderApp();
    expect(screen.getByText(/ЕГЭ становится проще/)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Zybrilka' })).not.toBeInTheDocument();
    restore();
  });

  it('shows the sidebar once navigated to an inner screen', async () => {
    const restore = mockDesktop(true);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Начать бесплатно/ }));
    expect(screen.getByRole('navigation', { name: 'Zybrilka' })).toBeInTheDocument();
    restore();
  });

  it('opens the desktop Menu over the current screen and closes it on Escape', async () => {
    const restore = mockDesktop(true);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Начать бесплатно/ }));
    await user.click(screen.getByRole('button', { name: 'Меню' }));
    const dialog = screen.getByRole('dialog', { name: 'Меню' });
    expect(dialog).toBeInTheDocument();
    // The screen underneath (the sidebar) stays mounted — Menu is a
    // panel over it, not a route replacing it.
    expect(screen.getByRole('navigation', { name: 'Zybrilka' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Меню' })).not.toBeInTheDocument();
    restore();
  });

  it('navigating from the desktop Menu closes it and switches screen', async () => {
    const restore = mockDesktop(true);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Начать бесплатно/ }));
    await user.click(screen.getByRole('button', { name: 'Меню' }));
    await user.click(screen.getByRole('button', { name: 'Моя статистика' }));
    expect(screen.queryByRole('dialog', { name: 'Меню' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Статистика' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    restore();
  });
});
