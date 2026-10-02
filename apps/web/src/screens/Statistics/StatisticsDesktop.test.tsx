import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsDesktop } from './StatisticsDesktop.js';
import { NavigationProvider } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getProgressSummary: vi.fn(),
  getProgressDaily: vi.fn(),
  getMistakes: vi.fn(),
  getProgressByTaskNumber: vi.fn(),
  getTaskNumberStatisticsDetail: vi.fn(),
}));

function renderStatistics() {
  return render(
    <NavigationProvider>
      <StatisticsDesktop />
    </NavigationProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.getProgressSummary).mockResolvedValue({
    solvedTotal: 0,
    correctTotal: 0,
    incorrectTotal: 0,
    accuracyPercent: 0,
    bySubject: [],
    byTaskNumber: [],
    byTopic: [],
    timeBySubject: [],
  });
  vi.mocked(api.getProgressDaily).mockResolvedValue({ items: [] });
  vi.mocked(api.getMistakes).mockResolvedValue([]);
  vi.mocked(api.getProgressByTaskNumber).mockResolvedValue({ items: [] });
});

describe('StatisticsDesktop — period switching', () => {
  it('renders the daily-activity chart for the default 30-day period, zero-filled from real daily data', () => {
    renderStatistics();
    const chart = screen.getByRole('img', { name: 'График активности по дням' });
    expect(chart.children).toHaveLength(30);
  });

  it('"Все время" renders the full 90-day zero-filled series without throwing', async () => {
    const user = userEvent.setup();
    renderStatistics();
    await user.click(screen.getByRole('tab', { name: 'Все время' }));

    const chart = screen.getByRole('img', { name: 'График активности по дням' });
    expect(chart.children).toHaveLength(90);

    const line = screen.getByRole('img', { name: 'График динамики правильных ответов' });
    expect(line.querySelectorAll('circle')).toHaveLength(90);
    expect(api.getProgressDaily).toHaveBeenLastCalledWith({ days: 90 });
  });

  it('switching between periods refetches with the matching days and changes the rendered point count', async () => {
    const user = userEvent.setup();
    renderStatistics();

    await user.click(screen.getByRole('tab', { name: '7 дней' }));
    expect(screen.getByRole('img', { name: 'График активности по дням' }).children).toHaveLength(7);
    expect(api.getProgressDaily).toHaveBeenLastCalledWith({ days: 7 });

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
      bySubject: [{ subjectId: 'math', solved: 3, correct: 2, accuracyPercent: 66.7 }],
      byTaskNumber: [],
      byTopic: [],
      timeBySubject: [],
    });
    renderStatistics();
    // "N из M" is rendered as-is (not animated), so it reflects the
    // real correct/solved counts as soon as the fetch resolves.
    expect(await screen.findByText('2 из 3')).toBeInTheDocument();
  });

  it('shows a neutral dash for average time/level, never a fabricated number', () => {
    renderStatistics();
    expect(screen.getByText('Среднее время')).toBeInTheDocument();
    expect(screen.getByText('Текущий уровень')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('the daily chart reflects real per-day attempts, not synthetic noise', async () => {
    vi.mocked(api.getProgressDaily).mockResolvedValue({
      items: [{ date: new Date().toISOString().slice(0, 10), solved: 5, accuracyPercent: 100 }],
    });
    renderStatistics();
    const chart = await screen.findByRole('img', { name: 'График активности по дням' });
    // The most recent bar (today, last child) must reflect the real
    // solved=5 attempt, not a synthetic value.
    const lastBar = chart.children[chart.children.length - 1]!.querySelector('[title]');
    expect(lastBar?.getAttribute('title')).toMatch(/: 5$/);
  });

  it('the errors donut and "Сложные темы" use real /mistakes data, showing an empty state with none', () => {
    renderStatistics();
    expect(screen.getAllByText('Пока нет данных об ошибках.').length).toBeGreaterThan(0);
  });
});

describe('StatisticsDesktop — По номерам detail (Statistics 2.0)', () => {
  it('clicking a real task number opens its detail, with a working back button', async () => {
    vi.mocked(api.getProgressByTaskNumber).mockResolvedValue({
      items: [{ subjectId: 'math', taskNumber: 5, total: 4, completed: 3 }],
    });
    vi.mocked(api.getTaskNumberStatisticsDetail).mockResolvedValue({
      subjectId: 'math',
      taskNumber: 5,
      attempts: 4,
      uniqueTasksAttempted: 3,
      correctAttempts: 3,
      incorrectAttempts: 1,
      accuracy: 75,
      averageTimeMs: 12000,
      medianTimeMs: 11000,
      timedAttempts: 4,
      lastAttemptAt: new Date().toISOString(),
      errorBreakdown: [],
      skillBreakdown: [],
      recentAccuracy: null,
      previousAccuracy: null,
      recentAverageTimeMs: null,
      accuracyTrend: [],
      timeTrend: [],
      speedSignal: { value: null, baselineLevel: null, baselineMedianMs: null, sampleSize: 0 },
    });
    const user = userEvent.setup();
    renderStatistics();
    await user.click(await screen.findByText('№5'));
    expect(await screen.findByText('75%')).toBeInTheDocument();
    expect(api.getTaskNumberStatisticsDetail).toHaveBeenCalledWith('math', 5);

    await user.click(screen.getByText('Назад к статистике'));
    expect(screen.queryByText('Назад к статистике')).not.toBeInTheDocument();
  });

  it('shows an honest empty state when the selected number has no attempts yet', async () => {
    vi.mocked(api.getProgressByTaskNumber).mockResolvedValue({
      items: [{ subjectId: 'math', taskNumber: 7, total: 2, completed: 0 }],
    });
    vi.mocked(api.getTaskNumberStatisticsDetail).mockResolvedValue({
      subjectId: 'math',
      taskNumber: 7,
      attempts: 0,
      uniqueTasksAttempted: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: null,
      averageTimeMs: null,
      medianTimeMs: null,
      timedAttempts: 0,
      lastAttemptAt: null,
      errorBreakdown: [],
      skillBreakdown: [],
      recentAccuracy: null,
      previousAccuracy: null,
      recentAverageTimeMs: null,
      accuracyTrend: [],
      timeTrend: [],
      speedSignal: { value: null, baselineLevel: null, baselineMedianMs: null, sampleSize: 0 },
    });
    const user = userEvent.setup();
    renderStatistics();
    await user.click(await screen.findByText('№7'));
    expect(await screen.findByText('Пока нет данных по №7.')).toBeInTheDocument();
  });
});
