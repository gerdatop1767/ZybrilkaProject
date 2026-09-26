import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpDesktop } from './HelpDesktop.js';
import { HelpMobile } from './HelpMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderWithNav(ui: React.ReactElement) {
  return render(
    <NavigationProvider>
      {ui}
      <OverlayMarker />
    </NavigationProvider>,
  );
}

const expectedCategories = [
  'Предложения',
  'Технические проблемы',
  'Проблемы с входом',
  'Другие запросы',
];

describe('HelpDesktop', () => {
  it('shows the hero heading and exactly the four approved categories', () => {
    renderWithNav(<HelpDesktop />);
    expect(screen.getByText('Нужна')).toBeInTheDocument();
    expect(screen.getByText('помощь?')).toBeInTheDocument();

    for (const title of expectedCategories) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.queryByText('Проблемы с заданиями')).not.toBeInTheDocument();
    expect(screen.queryByText('Статистика')).not.toBeInTheDocument();
  });

  it('disables the Telegram CTA when no bot URL is configured', () => {
    renderWithNav(<HelpDesktop />);
    expect(screen.queryByRole('link', { name: /Открыть бот/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Бот скоро будет подключён/)).toBeInTheDocument();
  });
});

describe('HelpMobile', () => {
  it('shows the hero heading and all four categories in a single column', () => {
    renderWithNav(<HelpMobile />);
    expect(screen.getByText('Нужна')).toBeInTheDocument();
    for (const title of expectedCategories) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('back button closes the overlay', async () => {
    const user = userEvent.setup();
    renderWithNav(<HelpMobile />);
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('none');
  });
});
