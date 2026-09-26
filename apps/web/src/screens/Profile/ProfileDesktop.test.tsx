import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileDesktop } from './ProfileDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderProfile(from?: Parameters<typeof ProfileDesktop>[0]['from']) {
  return render(
    <NavigationProvider>
      <ProfileDesktop from={from} />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('ProfileDesktop', () => {
  it('renders identity and the personal/settings sections, not stats or achievements', () => {
    renderProfile();
    expect(screen.getByText('Мой профиль')).toBeInTheDocument();
    expect(screen.getAllByText('ZybrilkaUser').length).toBeGreaterThan(0);
    expect(screen.getByText('Основная информация')).toBeInTheDocument();
    expect(screen.getByText('Учебные настройки')).toBeInTheDocument();
    expect(screen.getByText('Настройки аккаунта')).toBeInTheDocument();
    expect(screen.getByText('Действия')).toBeInTheDocument();

    // The screens this deliberately does NOT duplicate.
    expect(screen.queryByText('Твой прогресс')).not.toBeInTheDocument();
    expect(screen.queryByText('Последние достижения')).not.toBeInTheDocument();
    expect(screen.queryByText(/место в рейтинге/i)).not.toBeInTheDocument();
  });

  it('shows a destructive "Выйти из аккаунта" action', () => {
    renderProfile();
    expect(screen.getByRole('button', { name: /Выйти из аккаунта/ })).toBeInTheDocument();
  });

  it('opens the subject catalog from "Предметы ЕГЭ"', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: /Предметы ЕГЭ/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('subjectCatalog');
  });

  it('BackRow with no `from` falls back to closing the overlay (default tab)', async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: 'Главная' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });

  it('BackRow with an explicit `from` returns to that exact route', async () => {
    const user = userEvent.setup();
    renderProfile({ screen: 'about' });
    await user.click(screen.getByRole('button', { name: 'О проекте' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('about');
  });
});
