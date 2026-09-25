import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeMobile } from './HomeMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderHome() {
  return render(
    <NavigationProvider>
      <HomeMobile />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('HomeMobile', () => {
  it('renders the hero greeting and CTA', () => {
    renderHome();
    expect(screen.getByText(/Готов к новой/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeInTheDocument();
  });

  it('renders real progress numbers from shared data', () => {
    renderHome();
    expect(screen.getByText('320 / 500 XP')).toBeInTheDocument();
    expect(screen.getByText(/12 дней/)).toBeInTheDocument();
    expect(screen.getByText('248')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('renders every subject as a tappable card', () => {
    renderHome();
    for (const subject of subjects) {
      expect(screen.getAllByText(subject.shortName).length).toBeGreaterThan(0);
    }
  });

  it('navigates to a subject overlay when a subject card is tapped', async () => {
    const user = userEvent.setup();
    renderHome();
    const subjectCard = screen.getAllByRole('button', { name: /Математика/ })[0];
    await user.click(subjectCard!);
    expect(screen.getByTestId('overlay')).toHaveTextContent('subject');
  });

  it('navigates to the continue-training task', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /Тренировка · 15 заданий/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});
