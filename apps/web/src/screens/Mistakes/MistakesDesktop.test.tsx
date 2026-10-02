import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MistakesDesktop } from './MistakesDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getMistakes: vi.fn(),
}));

const apiMistakes = [
  {
    id: 'm1',
    taskId: '11111111-1111-1111-1111-111111111111',
    subjectId: 'math',
    taskNumber: 15,
    topicName: 'Логарифмы',
    conditionMd: 'Решите неравенство: log₂(x² − 3x − 4) ≥ 1',
    userAnswer: '(−∞; 2]',
    correctAnswer: '(−∞; −1] ∪ [2; +∞)',
    timesWrong: 2,
    status: 'open' as const,
    createdAt: '2026-09-25T00:00:00.000Z',
    updatedAt: '2026-09-25T00:00:00.000Z',
  },
  {
    id: 'm2',
    taskId: '22222222-2222-2222-2222-222222222222',
    subjectId: 'math',
    taskNumber: 11,
    topicName: 'Функции',
    conditionMd: 'Найдите наибольшее значение функции f(x) = x³ − 3x² − 9x + 4',
    userAnswer: '−1',
    correctAnswer: '9',
    timesWrong: 1,
    status: 'resolved' as const,
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
  },
];

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderScreen() {
  return render(
    <NavigationProvider>
      <MistakesDesktop />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.getMistakes).mockResolvedValue(apiMistakes);
});

describe('MistakesDesktop', () => {
  it('fetches real mistakes and renders them with counts derived from the response', async () => {
    renderScreen();
    expect(await screen.findByText(apiMistakes[0]!.conditionMd)).toBeInTheDocument();
    expect(screen.getByText(/Все ошибки 2/)).toBeInTheDocument();
    // Only the open mistake counts as unsolved.
    expect(screen.getByText(/Неразобранные 1/)).toBeInTheDocument();
  });

  it('opens the real task for a mistake via "Разобрать"', async () => {
    const user = userEvent.setup();
    renderScreen();
    await screen.findByText(apiMistakes[0]!.conditionMd);
    await user.click(screen.getAllByRole('button', { name: /Разобрать/ })[0]!);
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });

  it('groups mistakes by task number, with the number as the group header', async () => {
    renderScreen();
    await screen.findByText(apiMistakes[0]!.conditionMd);
    expect(screen.getByRole('button', { name: /№15/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /№11/ })).toBeInTheDocument();
    expect(screen.getAllByText('1 ошибка')).toHaveLength(2);
  });

  it('collapses and re-expands a task-number group without losing the real mistake', async () => {
    const user = userEvent.setup();
    renderScreen();
    await screen.findByText(apiMistakes[0]!.conditionMd);
    const group15Header = screen.getByRole('button', { name: /№15/ });
    expect(group15Header).toHaveAttribute('aria-expanded', 'true');
    await user.click(group15Header);
    expect(group15Header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(apiMistakes[0]!.conditionMd)).not.toBeInTheDocument();
    await user.click(group15Header);
    expect(await screen.findByText(apiMistakes[0]!.conditionMd)).toBeInTheDocument();
  });
});
