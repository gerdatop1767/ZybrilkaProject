import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Training } from './Training.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  listCollections: vi.fn(),
  getRandomTask: vi.fn(),
  getVariant: vi.fn(),
}));

const COLLECTION = {
  collection: {
    id: 'c1',
    subjectId: 'math',
    slug: 'ege-2026-yashchenko',
    title: 'ЕГЭ 2026 Ященко',
    publisher: 'Ященко',
    year: 2026,
    description: null,
  },
  variants: [{ id: 'v1', collectionId: 'c1', variantNumber: 1, title: 'Вариант 1', year: 2026 }],
};

const RANDOM_TASK = {
  id: 'task-1',
  subjectId: 'math',
  taskNumber: 5,
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

function renderTraining() {
  return render(
    <NavigationProvider>
      <Training />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.listCollections).mockResolvedValue([]);
});

describe('Training', () => {
  it('renders all training mode options', () => {
    renderTraining();
    expect(screen.getByRole('button', { name: /По теме/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Мои ошибки/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Умная тренировка/ })).toBeInTheDocument();
  });

  it('selects a training mode and shows clear selected-state feedback', async () => {
    const user = userEvent.setup();
    renderTraining();
    const topicMode = screen.getByRole('button', { name: /По теме/ });
    const mistakesMode = screen.getByRole('button', { name: /Мои ошибки/ });
    expect(topicMode).toHaveAttribute('aria-pressed', 'true');
    await user.click(mistakesMode);
    expect(mistakesMode).toHaveAttribute('aria-pressed', 'true');
    expect(topicMode).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects a difficulty chip', async () => {
    const user = userEvent.setup();
    renderTraining();
    const hard = screen.getByRole('button', { name: 'Сложный' });
    await user.click(hard);
    expect(hard).toHaveAttribute('aria-pressed', 'true');
  });

  it('fetches a real random task and navigates to it on start', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task:5');
    });
    expect(api.getRandomTask).toHaveBeenCalledWith({
      subject: 'math',
      collection: undefined,
      taskNumber: undefined,
    });
  });

  it('passes a typed task number ("по заданиям") to the real random-task query', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();
    await user.type(screen.getByLabelText('Номер задания'), '5');
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(expect.objectContaining({ taskNumber: 5 }));
    });
  });

  it('navigates straight to the real Mistakes screen for "Мои ошибки", without fetching a task', async () => {
    const user = userEvent.setup();
    renderTraining();
    await user.click(screen.getByRole('button', { name: /Мои ошибки/ }));
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('mistakes');
    expect(api.getRandomTask).not.toHaveBeenCalled();
  });

  it('lists real collections ("Сборник") and scopes the random query to the chosen one', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([COLLECTION]);
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    renderTraining();

    const trigger = await screen.findByRole('button', { name: /Все источники/ });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'ege-2026-yashchenko' }),
      );
    });
  });

  it('starts the real ordered "Полный вариант" at its first task', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listCollections).mockResolvedValue([COLLECTION]);
    vi.mocked(api.getVariant).mockResolvedValue({
      variant: COLLECTION.variants[0]!,
      collection: COLLECTION.collection,
      tasks: [
        { position: 1, task: RANDOM_TASK },
        { position: 2, task: { ...RANDOM_TASK, id: 'task-2', taskNumber: 6 } },
      ],
    });
    renderTraining();

    await user.click(screen.getByRole('button', { name: /^Вариант/ }));
    const collectionTrigger = await screen.findByRole('button', { name: /Все источники/ });
    await user.click(collectionTrigger);
    await user.click(await screen.findByRole('option', { name: 'ЕГЭ 2026 Ященко' }));
    await user.click(await screen.findByRole('button', { name: 'Вариант 1' }));

    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task:5');
    });
    expect(api.getVariant).toHaveBeenCalledWith('v1');
  });

  it('shows an error instead of crashing when no matching task is found', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getRandomTask).mockRejectedValue(new Error('no tasks'));
    renderTraining();
    await user.click(screen.getByRole('button', { name: 'Начать тренировку' }));
    expect(await screen.findByText(/Не нашлось подходящих заданий/)).toBeInTheDocument();
  });
});
