import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';

describe('App', () => {
  it('renders the project name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Zybrilka' })).toBeInTheDocument();
  });

  it('renders the primary navigation', () => {
    render(<App />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Главная/ })).toHaveAttribute('aria-current', 'page');
  });
});
