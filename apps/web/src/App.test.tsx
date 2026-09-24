import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';
import { ToastProvider } from './ui/Toast/ToastProvider.js';

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  );
}

describe('App', () => {
  it('renders the project name', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: 'Zybrilka' })).toBeInTheDocument();
  });

  it('renders the primary navigation', () => {
    renderApp();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Главная/ })).toHaveAttribute('aria-current', 'page');
  });
});
