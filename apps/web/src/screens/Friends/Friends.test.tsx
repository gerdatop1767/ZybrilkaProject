import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendsDesktop } from './FriendsDesktop.js';
import { FriendsMobile } from './FriendsMobile.js';
import { FriendProfileDesktop } from './FriendProfileDesktop.js';
import { DesktopSidebar } from '../../ui/DesktopShell/DesktopSidebar.js';
import { NavigationProvider } from '../../lib/navigation.js';
import { pathForRoute, routeFromPath } from '../../lib/routes.js';
import { friends, initialFriendRequests } from '../../data/sampleFriends.js';
import { getStreakAsset, getLevelAsset } from '../../lib/rank.js';

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

describe('Friends routing', () => {
  it('round-trips /friends and /friends/:id through the router', () => {
    expect(routeFromPath('/friends')).toEqual({ screen: 'friends' });
    expect(routeFromPath('/friends/alex_math')).toEqual({
      screen: 'friendProfile',
      friendId: 'alex_math',
    });
    expect(pathForRoute({ screen: 'friendProfile', friendId: 'alex_math' })).toBe(
      '/friends/alex_math',
    );
  });
});

describe('DesktopSidebar', () => {
  it('has a "Друзья" entry that navigates to /friends', async () => {
    const user = userEvent.setup();
    renderWithNav(<DesktopSidebar />);
    const link = screen.getByRole('button', { name: 'Друзья' });
    expect(link).toBeInTheDocument();
    await user.click(link);
    expect(window.location.pathname).toBe('/friends');
  });
});

describe('FriendsDesktop', () => {
  it('shows the mock friends with dynamic tab counts', () => {
    renderWithNav(<FriendsDesktop />);
    expect(screen.getByRole('heading', { name: 'Друзья' })).toBeInTheDocument();
    expect(screen.getAllByText('alex_math').length).toBeGreaterThan(0);
    const onlineCount = friends.filter((f) => f.online).length;
    expect(
      screen.getByRole('button', { name: `Все друзья (${friends.length})` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Онлайн (${onlineCount})` })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Запросы (${initialFriendRequests.length})` }),
    ).toBeInTheDocument();
  });

  it('filters the friend list by search query', async () => {
    const user = userEvent.setup();
    renderWithNav(<FriendsDesktop />);
    await user.type(screen.getByLabelText('Найти друга'), 'diana');
    expect(screen.getAllByText('Diana_ege').length).toBeGreaterThan(0);
    // Only one "Профиль →" row should remain in the filtered main list
    // (the always-visible "Рейтинг друзей" sidebar mini-list is unaffected).
    expect(screen.getAllByRole('button', { name: /Профиль/ })).toHaveLength(1);
  });

  it('shows an empty state when nothing matches the search', async () => {
    const user = userEvent.setup();
    renderWithNav(<FriendsDesktop />);
    await user.type(screen.getByLabelText('Найти друга'), 'zzz-no-such-user');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('copies the invite link via the clipboard API', async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard();
    renderWithNav(<FriendsDesktop />);
    await user.click(screen.getByRole('button', { name: /Пригласить друга/ }));
    expect(writeText).toHaveBeenCalledWith('https://zybrilka.ru/invite/AB7F3K');
    expect(await screen.findByText(/Ссылка скопирована/)).toBeInTheDocument();
  });

  it('accepts and rejects friend requests as real local state', async () => {
    const user = userEvent.setup();
    renderWithNav(<FriendsDesktop />);
    await user.click(
      screen.getByRole('button', { name: `Запросы (${initialFriendRequests.length})` }),
    );
    const firstRequest = initialFriendRequests[0]!;
    const row = screen.getByText(firstRequest.user.username).closest('div')!.parentElement!;
    await user.click(within(row).getByRole('button', { name: 'Принять' }));
    expect(screen.queryByText(firstRequest.user.username)).not.toBeInTheDocument();

    const secondRequest = initialFriendRequests[1]!;
    const row2 = screen.getByText(secondRequest.user.username).closest('div')!.parentElement!;
    await user.click(within(row2).getByRole('button', { name: 'Отклонить' }));
    expect(screen.queryByText(secondRequest.user.username)).not.toBeInTheDocument();
  });

  it('uses the shared LevelBadge/StreakBadge PNGs, never an emoji', () => {
    renderWithNav(<FriendsDesktop />);
    const alex = friends[0]!;
    expect(document.querySelector(`img[src="${getLevelAsset(alex.level)}"]`)).toBeInTheDocument();
    expect(
      document.querySelector(`img[src="${getStreakAsset(alex.streakDays)}"]`),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/🔥|👑/);
  });
});

describe('FriendsMobile', () => {
  it('renders the mock friends in a single column', () => {
    renderWithNav(<FriendsMobile />);
    expect(screen.getAllByText('alex_math').length).toBeGreaterThan(0);
    expect(screen.getByText('Друзья')).toBeInTheDocument();
  });
});

describe('FriendProfileDesktop', () => {
  it('shows the friend profile with badges and subject progress', () => {
    renderWithNav(<FriendProfileDesktop friendId="alex_math" />);
    expect(screen.getByRole('heading', { name: 'alex_math' })).toBeInTheDocument();
    expect(screen.getByText('87 дней')).toBeInTheDocument();
    expect(screen.getByText('Математика')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  it('shows an honest not-found state for an unknown id', () => {
    renderWithNav(<FriendProfileDesktop friendId="no-such-user" />);
    expect(screen.getByText('Друг не найден')).toBeInTheDocument();
  });
});

describe('BackRow labels', () => {
  it('/friends never shows a stray "← Достижения"/"← Рейтинг" label — only "Главная"', () => {
    renderWithNav(<FriendsDesktop />);
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.queryByText('Достижения')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Рейтинг$/)).not.toBeInTheDocument();
  });

  it('/friends/:id always points its BackRow at "Друзья", never a stale tab', () => {
    renderWithNav(<FriendProfileDesktop friendId="alex_math" />);
    expect(screen.getByText('Друзья')).toBeInTheDocument();
  });
});
