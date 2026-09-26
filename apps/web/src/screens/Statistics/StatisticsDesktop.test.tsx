import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsDesktop } from './StatisticsDesktop.js';
import { NavigationProvider } from '../../lib/navigation.js';

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
