import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectCatalogMobile } from './SubjectCatalogMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderCatalog() {
  return render(
    <NavigationProvider>
      <SubjectCatalogMobile />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('SubjectCatalogMobile', () => {
  it('shows every subject with a real illustration, not a flat glyph', () => {
    renderCatalog();
    for (const subject of subjects) {
      expect(screen.getByText(subject.shortName)).toBeInTheDocument();
      expect(
        document.querySelector(`img[src="/branding/v2/subjects/${subject.id}.png"]`),
      ).toBeInTheDocument();
    }
  });

  it('shows the three summary stats', () => {
    renderCatalog();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('предметов')).toBeInTheDocument();
    expect(screen.getByText('Полная')).toBeInTheDocument();
  });

  it('navigates to a subject when tapped', async () => {
    const user = userEvent.setup();
    renderCatalog();
    await user.click(screen.getByRole('button', { name: /Математика/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('subject');
  });
});
