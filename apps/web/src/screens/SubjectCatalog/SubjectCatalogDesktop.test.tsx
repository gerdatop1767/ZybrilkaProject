import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectCatalogDesktop } from './SubjectCatalogDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { pathForRoute } from '../../lib/routes.js';
import { subjects } from '../../data/subjects.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{JSON.stringify(overlay)}</p>;
}

function renderCatalog() {
  return render(
    <NavigationProvider>
      <SubjectCatalogDesktop />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('SubjectCatalogDesktop', () => {
  it('renders all 9 subject cards with their real illustration', () => {
    renderCatalog();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(9);
    for (const subject of subjects) {
      expect(
        document.querySelector(`img[src="/branding/v2/subjects/${subject.id}.png"]`),
      ).toBeInTheDocument();
    }
  });

  it('renders the three summary illustrations', () => {
    renderCatalog();
    for (const file of ['subjects.png', 'tasks.png', 'full-statistics.png']) {
      expect(document.querySelector(`img[src="/branding/v2/summary/${file}"]`)).toBeInTheDocument();
    }
  });

  it('opening a subject navigates to its correctly-slugged route', async () => {
    const user = userEvent.setup();
    renderCatalog();
    await user.click(screen.getByText('Обществознание'));
    const overlay = JSON.parse(screen.getByTestId('overlay').textContent!);
    expect(overlay.screen).toBe('subject');
    expect(overlay.subjectId).toBe('social');
    expect(pathForRoute(overlay)).toBe('/subjects/social-studies');
  });
});
