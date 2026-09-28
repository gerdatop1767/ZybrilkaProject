import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsMobile } from './StatisticsMobile.js';
import { NavigationProvider } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getProgressSummary: vi.fn(),
  getProgressByTaskNumber: vi.fn(),
  getProgressByTopic: vi.fn(),
  getMistakes: vi.fn(),
  getRandomTask: vi.fn(() => new Promise(() => {})),
}));

function renderWithNav() {
  return render(
    <NavigationProvider>
      <StatisticsMobile />
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
  });
  vi.mocked(api.getProgressByTaskNumber).mockResolvedValue({ items: [] });
  vi.mocked(api.getProgressByTopic).mockResolvedValue({ items: [] });
  vi.mocked(api.getMistakes).mockResolvedValue([]);
});

describe('StatisticsMobile', () => {
  it('shows the overview tab by default with real data, not a stub', () => {
    renderWithNav();
    expect(screen.getByText('Прогресс по заданиям (1–19)')).toBeInTheDocument();
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
  });

  it('По заданиям tab always shows the full real 1–19 grid, not a stub', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По заданиям' }));
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
    for (let n = 1; n <= 19; n += 1) {
      expect(screen.getByText(`№${n}`)).toBeInTheDocument();
    }
  });

  it('По темам tab shows a neutral empty state, not fake hash rows, when there is no topic data', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По темам' }));
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
    expect(screen.getByText('Пока нет данных по темам.')).toBeInTheDocument();
    expect(screen.getByText('Пока нет данных об ошибках.')).toBeInTheDocument();
  });

  it('По темам tab shows real topics fetched from the API', async () => {
    vi.mocked(api.getProgressByTopic).mockResolvedValue({
      items: [{ topicId: 't1', topicName: 'Логарифмы', total: 4, completed: 2 }],
    });
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По темам' }));
    await waitFor(() => expect(screen.getAllByText('Логарифмы').length).toBeGreaterThan(0));
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('Пробники tab shows a neutral empty state, never fabricated exams', async () => {
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'Пробники' }));
    expect(screen.queryByText('Экран в разработке — следующий блок.')).not.toBeInTheDocument();
    expect(screen.getByText('0 пробников решено')).toBeInTheDocument();
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

  it('shows a neutral dash for streak/average-time, never a fabricated number', () => {
    renderWithNav();
    expect(screen.getByText('Текущая серия')).toBeInTheDocument();
    expect(screen.getByText('Среднее время')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });
});

describe('StatisticsMobile — real progress data', () => {
  it('shows real per-task-number completion once the API responds, including untried numbers', async () => {
    vi.mocked(api.getProgressByTaskNumber).mockResolvedValue({
      items: [{ subjectId: 'math', taskNumber: 1, total: 4, completed: 3 }],
    });
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По заданиям' }));
    const grid = await screen.findByRole('list', { name: 'Прогресс по всем заданиям' });
    expect(within(grid).getByText('75%')).toBeInTheDocument();
    // Task numbers with no recorded attempt render as "не решалось",
    // not a fabricated percent.
    expect(within(grid).getAllByText('Не решалось').length).toBeGreaterThan(0);
  });

  it('the solvedTotal/accuracy headline tiles use real /progress/summary data', async () => {
    vi.mocked(api.getProgressSummary).mockResolvedValue({
      solvedTotal: 12,
      correctTotal: 9,
      incorrectTotal: 3,
      accuracyPercent: 75,
      bySubject: [],
      byTaskNumber: [],
      byTopic: [],
    });
    renderWithNav();
    // The percent itself animates in (useCountUp) — assert the static,
    // non-animated delta label instead of racing the animation.
    await waitFor(() => expect(screen.getByText('9 верных')).toBeInTheDocument());
  });

  it('the errors donut uses real /mistakes data, never the static sample set', async () => {
    vi.mocked(api.getMistakes).mockResolvedValue([
      {
        id: 'm1',
        taskId: 'task-1',
        subjectId: 'math',
        taskNumber: 5,
        topicName: 'Логарифмы',
        conditionMd: 'Условие',
        userAnswer: 'x',
        correctAnswer: 'y',
        timesWrong: 1,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const user = userEvent.setup();
    renderWithNav();
    await user.click(screen.getByRole('tab', { name: 'По темам' }));
    await waitFor(() =>
      expect(screen.queryByText('Пока нет данных об ошибках.')).not.toBeInTheDocument(),
    );
  });
});
