import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsMobile } from './StatisticsMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';
import { taskNumberProgress, topicMasteryRows, mockExams } from '../../data/sampleStatistics.js';

function renderWithNav() {
  return render(
    <NavigationProvider>
      <StatisticsMobile />
    </NavigationProvider>,
  );
}

describe('StatisticsMobile', () => {
  it('shows the overview tab by default with real data, not a stub', () => {
    renderWithNav();
    expect(screen.getByText('Прогресс по заданиям (1–19)')).toBeInTheDocument();
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
  });

  it('По заданиям tab shows every task number as a real tappable grid, not a stub', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По заданиям' }));
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
    for (const row of taskNumberProgress) {
      expect(screen.getByText(`№${row.number}`)).toBeInTheDocument();
    }
  });

  it('По темам tab shows every topic with mastery, not a stub', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По темам' }));
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
    for (const row of topicMasteryRows) {
      expect(screen.getAllByText(row.topic).length).toBeGreaterThan(0);
    }
  });

  it('Пробники tab shows every mock exam, not a stub', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'Пробники' }));
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
    for (const exam of mockExams) {
      expect(screen.getByText(exam.label)).toBeInTheDocument();
    }
    expect(screen.getByText('Новый пробник')).toBeInTheDocument();
  });

  it('every task-number card is a real tappable button', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По заданиям' }));
    const card = screen.getByText('№1').closest('button');
    expect(card).toBeInTheDocument();
    // Should not throw when tapped.
    await user.click(card!);
  });
});
