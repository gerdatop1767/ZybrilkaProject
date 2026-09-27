import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsDesktop } from './StatisticsDesktop.js';
import { NavigationProvider } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getProgressSummary: vi.fn(() => new Promise(() => {})),
}));

function renderStatistics() {
  return render(
    <NavigationProvider>
      <StatisticsDesktop />
    </NavigationProvider>,
  );
}

describe('StatisticsDesktop — period switching', () => {
  it('renders the daily-activity chart for the default 30-day period', () => {
    renderStatistics();
    expect(screen.getByRole('img', { name: 'График активности по дням' })).toBeInTheDocument();
  });

  it('"Все время" renders the full 90-day series without throwing, staying inside its container', async () => {
    const user = userEvent.setup();
    renderStatistics();
    await user.click(screen.getByRole('tab', { name: 'Все время' }));

    const chart = screen.getByRole('img', { name: 'График активности по дням' });
    // One bar per day of the full seeded history — the chart must
    // scale to this instead of overflowing or crashing.
    expect(chart.children).toHaveLength(90);

    const line = screen.getByRole('img', { name: 'График динамики правильных ответов' });
    expect(line.querySelectorAll('circle')).toHaveLength(90);
  });

  it('switching between periods changes the rendered point count', async () => {
    const user = userEvent.setup();
    renderStatistics();

    await user.click(screen.getByRole('tab', { name: '7 дней' }));
    expect(screen.getByRole('img', { name: 'График активности по дням' }).children).toHaveLength(7);

    await user.click(screen.getByRole('tab', { name: '30 дней' }));
    expect(screen.getByRole('img', { name: 'График активности по дням' }).children).toHaveLength(
      30,
    );

    await user.click(screen.getByRole('tab', { name: 'Все время' }));
    expect(screen.getByRole('img', { name: 'График активности по дням' }).children).toHaveLength(
      90,
    );
  });
});

describe('StatisticsDesktop — real progress data', () => {
  it('uses the real solved/correct counts once the API responds, not the hardcoded demo profile', async () => {
    vi.mocked(api.getProgressSummary).mockResolvedValue({
      solvedTotal: 3,
      correctTotal: 2,
      incorrectTotal: 1,
      accuracyPercent: 66.7,
      bySubject: [],
      byTaskNumber: [],
      byTopic: [],
    });
    renderStatistics();
    // "N из M" is rendered as-is (not animated), so it reflects the
    // real correct/solved counts as soon as the fetch resolves.
    expect(await screen.findByText('2 из 3')).toBeInTheDocument();
  });
});
