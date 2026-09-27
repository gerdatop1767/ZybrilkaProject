import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MistakesMobile } from './MistakesMobile.js';
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
];

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderScreen() {
  return render(
    <NavigationProvider>
      <MistakesMobile />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('MistakesMobile', () => {
  it('fetches real mistakes and shows the unsolved one in "Повторить ошибки"', async () => {
    vi.mocked(api.getMistakes).mockResolvedValue(apiMistakes);
    renderScreen();
    expect(await screen.findByText(apiMistakes[0]!.conditionMd)).toBeInTheDocument();
  });

  it('shows the resolved-all state once every mistake is resolved', async () => {
    vi.mocked(api.getMistakes).mockResolvedValue([
      { ...apiMistakes[0]!, status: 'resolved' as const },
    ]);
    renderScreen();
    expect(await screen.findByText('Все ошибки разобраны!')).toBeInTheDocument();
  });

  it('opens the real task when a mistake is tapped', async () => {
    vi.mocked(api.getMistakes).mockResolvedValue(apiMistakes);
    const user = userEvent.setup();
    renderScreen();
    await screen.findByText(apiMistakes[0]!.conditionMd);
    await user.click(screen.getByText(apiMistakes[0]!.conditionMd));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});
