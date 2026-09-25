import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutDesktop } from './AboutDesktop.js';
import { AboutMobile } from './AboutMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';
import { faqItems } from '../../data/sampleAbout.js';

function renderWithNav(ui: React.ReactElement) {
  return render(<NavigationProvider>{ui}</NavigationProvider>);
}

describe('AboutDesktop', () => {
  it('renders the hero heading and illustration', () => {
    renderWithNav(<AboutDesktop />);
    expect(screen.getByText(/Сделать подготовку к ЕГЭ/)).toBeInTheDocument();
    expect(screen.getByAltText('')).toHaveAttribute(
      'src',
      '/branding/v2/about-illustration-desktop.webp',
    );
  });

  it('expands a FAQ answer on click', async () => {
    const user = userEvent.setup();
    renderWithNav(<AboutDesktop />);
    const first = faqItems[0]!;
    await user.click(screen.getByRole('button', { name: new RegExp(first.question) }));
    expect(screen.getByText(first.answer)).toBeInTheDocument();
  });
});

describe('AboutMobile', () => {
  it('renders the "Зубрилка" hero on the О проекте tab', () => {
    renderWithNav(<AboutMobile />);
    expect(screen.getByText('Зубрилка')).toBeInTheDocument();
  });

  it('shows a WIP note for other tabs', async () => {
    const user = userEvent.setup();
    renderWithNav(<AboutMobile />);
    await user.click(screen.getByRole('tab', { name: 'Команда' }));
    expect(screen.getByText('Экран в разработке — следующий блок.')).toBeInTheDocument();
  });
});
