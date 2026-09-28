import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from './Onboarding.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

function TabMarker() {
  const { tab, overlay } = useNavigation();
  return <p data-testid="nav">{overlay ? overlay.screen : tab}</p>;
}

function renderOnboarding() {
  return render(
    <NavigationProvider>
      <Onboarding />
      <TabMarker />
    </NavigationProvider>,
  );
}

describe('Onboarding', () => {
  it('starts on the welcome step', () => {
    renderOnboarding();
    expect(screen.getByText('Добро пожаловать в Zybrilka!')).toBeInTheDocument();
  });

  it('progresses through subject selection to the focus step', async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    expect(screen.getByText('Какие предметы сдаёшь?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByText('На чём сфокусироваться?')).toBeInTheDocument();
  });

  it('requires a focus choice before continuing to the diagnostic intro', async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    const next = screen.getByRole('button', { name: 'Далее' });
    expect(next).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Первая часть ЕГЭ/ }));
    expect(next).toBeEnabled();
  });

  it('reaches the diagnostic result step and finishes into Home', async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: /Первая часть ЕГЭ/ }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(screen.getByText('Почти готово!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Перейти к тренировкам' }));
    expect(screen.getByTestId('nav')).toHaveTextContent('home');
  });

  it('closes the onboarding overlay from the first step’s back button', async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByTestId('nav')).toHaveTextContent('home');
  });
});
