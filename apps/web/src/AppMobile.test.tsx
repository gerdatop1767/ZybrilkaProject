import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppMobile } from './AppMobile.js';
import { NavigationProvider, useNavigation } from './lib/navigation.js';
import * as api from './lib/api.js';

vi.mock('./lib/api.js', () => ({
  getRandomTask: vi.fn(),
  getTask: vi.fn(),
  listTasksByNumber: vi.fn(),
  getProgressSummary: vi.fn(() => new Promise(() => {})),
}));

const RANDOM_TASK = {
  id: 'task-1',
  subjectId: 'math',
  taskNumber: 7,
  topicId: null,
  topicName: null,
  difficulty: 2 as const,
  conditionMd: 'Условие',
  imageUrl: null,
  hintMd: null,
  answerType: 'short_answer' as const,
  answerOptions: null,
  answerParts: null,
  source: 'ФИПИ',
  sourceUrl: null,
  sourceYear: 2026,
  tags: [],
  status: 'published' as const,
};

function OverlayMarker() {
  const { overlay } = useNavigation();
  if (overlay?.screen === 'task') {
    return <p data-testid="overlay">task:{overlay.taskNumber}</p>;
  }
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

describe('AppMobile — bottom nav "Тренировка" tab', () => {
  it('fetches a real random task and opens it, instead of the hardcoded design-mock task', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    vi.mocked(api.getTask).mockResolvedValue(RANDOM_TASK);
    vi.mocked(api.listTasksByNumber).mockResolvedValue([RANDOM_TASK]);
    render(
      <NavigationProvider>
        <AppMobile />
        <OverlayMarker />
      </NavigationProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Тренировка' }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task:7');
    });
    expect(api.getRandomTask).toHaveBeenCalledWith({ subject: 'math' });
  });
});
