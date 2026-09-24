import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgressScreen } from './ProgressScreen.js';
import { userStats, topicMastery } from '../../data/sampleProgress.js';

describe('ProgressScreen', () => {
  it('renders overall accuracy, solved count and streak', async () => {
    render(<ProgressScreen />);
    await waitFor(
      () => {
        expect(screen.getByRole('progressbar', { name: 'Точность' })).toHaveAttribute(
          'aria-valuenow',
          String(userStats.accuracy),
        );
      },
      { timeout: 3000 },
    );
    expect(screen.getByText(String(userStats.solvedTotal))).toBeInTheDocument();
    expect(screen.getByText(String(userStats.streakDays))).toBeInTheDocument();
  });

  it('flags weak topics', () => {
    render(<ProgressScreen />);
    const weakTopic = topicMastery.find((topic) => topic.weak);
    expect(weakTopic).toBeDefined();
    expect(screen.getAllByText(weakTopic!.topic).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Слабая тема').length).toBeGreaterThan(0);
  });

  it('renders subject progress bars', () => {
    render(<ProgressScreen />);
    expect(screen.getByRole('progressbar', { name: 'Математика' })).toBeInTheDocument();
  });
});
