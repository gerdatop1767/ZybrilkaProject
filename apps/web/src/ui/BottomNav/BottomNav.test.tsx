import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav.js';
import { defaultBottomNavItems } from './defaultItems.js';

describe('BottomNav', () => {
  it('renders all 5 default items', () => {
    render(<BottomNav items={defaultBottomNavItems} activeId="home" onSelect={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: /Главная/ })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onSelect with the tapped item id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BottomNav items={defaultBottomNavItems} activeId="home" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Профиль/ }));
    expect(onSelect).toHaveBeenCalledWith('profile');
  });
});
