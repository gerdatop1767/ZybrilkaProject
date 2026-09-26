import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeMobile } from './HomeMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { userStats } from '../../data/sampleProgress.js';
import { getStreakAsset, getLevelAsset } from '../../lib/rank.js';

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

  it('renders every popular subject as a tappable card', () => {
    renderHome();
    for (const subject of subjects.slice(0, 6)) {
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

  it('uses the shared LevelBadge/StreakBadge PNGs in the progress card, never an emoji', () => {
    renderHome();
    expect(
      document.querySelector(`img[src="${getLevelAsset(userStats.level)}"]`),
    ).toBeInTheDocument();
    expect(
      document.querySelector(`img[src="${getStreakAsset(userStats.streakDays)}"]`),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/🔥|👑/);
  });

  it('shows a real subject illustration for every popular subject, not a flat glyph tile', () => {
    renderHome();
    for (const subject of subjects.slice(0, 6)) {
      expect(
        document.querySelector(`img[src="/branding/v2/subjects/${subject.id}.png"]`),
      ).toBeInTheDocument();
    }
  });

  it('keeps the hero heading/subtitle width-capped so the floating subject tiles never crowd them', () => {
    const { container } = renderHome();
    const heroTiles = container.querySelector('[aria-hidden="true"]');
    expect(heroTiles).toBeInTheDocument();
    expect(heroTiles!.querySelectorAll('img').length).toBe(3);
  });
});
