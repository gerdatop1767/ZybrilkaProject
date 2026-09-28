import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectMobile } from './SubjectMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { getSubjectContent } from '../../data/subjectContent.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getRandomTask: vi.fn(),
  listCollections: vi.fn(),
  getProgressByTaskNumber: vi.fn(),
  getProgressByTopic: vi.fn(),
}));

// Every render starts on the 'topics' mode, so its effect always fires —
// a neutral default keeps unrelated tests from needing to know about it.
beforeEach(() => {
  vi.mocked(api.getProgressByTopic).mockResolvedValue({ items: [] });
});

const YASHCHENKO_COLLECTION = {
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

function mockCollections(items = [YASHCHENKO_COLLECTION]) {
  vi.mocked(api.listCollections).mockResolvedValue(items);
}

function aggregateProgress() {
  return {
    items: Array.from({ length: 19 }, (_, i) => ({
      subjectId: 'math',
      taskNumber: i + 1,
      total: 3,
      completed: 0,
    })),
  };
}

function mockProgress(res = aggregateProgress()) {
  vi.mocked(api.getProgressByTaskNumber).mockResolvedValue(res);
}

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
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderSubject(subjectId = 'math') {
  return render(
    <NavigationProvider>
      <SubjectMobile subjectId={subjectId} from="subjectCatalog" />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('SubjectMobile', () => {
  it('renders the hero and real topics (not the static design-content list)', async () => {
    mockCollections();
    mockProgress();
    vi.mocked(api.getProgressByTopic).mockResolvedValue({
      items: [{ topicId: 't1', topicName: 'Логарифмы', total: 4, completed: 1 }],
    });
    renderSubject();
    const content = getSubjectContent('math');
    expect(screen.getAllByText('Математика').length).toBeGreaterThan(0);
    expect(screen.getByText(content.tagline)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Логарифмы')).toBeInTheDocument());
    expect(screen.getByText('1/4')).toBeInTheDocument();
  });

  it('an empty topic list shows a neutral empty state, not a fake row', async () => {
    mockCollections();
    mockProgress();
    renderSubject();
    await waitFor(() =>
      expect(screen.getByText('В этом источнике пока нет тем.')).toBeInTheDocument(),
    );
  });

  it('switches to Задания по номерам and shows every task number with real X/Y, not a fake hash', async () => {
    mockCollections();
    mockProgress();
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'По номерам' }));
    await waitFor(() => {
      for (let n = 1; n <= 19; n += 1) {
        expect(screen.getByText(`№${n}`)).toBeInTheDocument();
      }
    });
    expect(api.getProgressByTaskNumber).toHaveBeenCalledWith({
      subject: 'math',
      collection: undefined,
    });
  });

  it('shows a real "Общий банк" + collection source picker, and switching source refetches', async () => {
    mockCollections();
    vi.mocked(api.getProgressByTaskNumber).mockImplementation(({ collection }) =>
      Promise.resolve({
        items: Array.from({ length: 19 }, (_, i) => ({
          subjectId: 'math',
          taskNumber: i + 1,
          total: collection ? 1 : 3,
          completed: 0,
        })),
      }),
    );
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'По номерам' }));
    await waitFor(() => expect(screen.getByText('Общий банк')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Общий банк' }));
    await user.click(screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await waitFor(() => {
      expect(api.getProgressByTaskNumber).toHaveBeenLastCalledWith({
        subject: 'math',
        collection: 'ege-2026-yashchenko',
      });
    });
  });

  it('switches to Варианты and shows the (unchanged) fake source picker + number chips', async () => {
    mockCollections();
    mockProgress();
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'Варианты' }));
    expect(screen.getByText('Официальные ФИПИ')).toBeInTheDocument();
    expect(screen.getByText('Выбрать всё')).toBeInTheDocument();
  });

  it('drills into a real topic and back returns to the topics list without leaving the page', async () => {
    mockCollections();
    mockProgress();
    vi.mocked(api.getProgressByTopic).mockResolvedValue({
      items: [
        { topicId: 't1', topicName: 'Логарифмы', total: 4, completed: 1 },
        { topicId: 't2', topicName: 'Планиметрия', total: 2, completed: 0 },
      ],
    });
    const user = userEvent.setup();
    renderSubject();
    await waitFor(() => screen.getByText('Логарифмы'));
    await user.click(screen.getAllByText('Логарифмы')[0]!);
    expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getAllByText('Планиметрия').length).toBeGreaterThan(0);
  });

  it('starting a topic training session passes the real topicId and navigates to the task overlay', async () => {
    mockCollections();
    mockProgress();
    vi.mocked(api.getProgressByTopic).mockResolvedValue({
      items: [{ topicId: 'real-topic-id', topicName: 'Логарифмы', total: 4, completed: 1 }],
    });
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    const user = userEvent.setup();
    renderSubject();
    await waitFor(() => screen.getByText('Логарифмы'));
    await user.click(screen.getAllByText('Логарифмы')[0]!);
    await user.click(screen.getByRole('button', { name: /Начать тренировку/ }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'math', topic: 'real-topic-id' }),
      );
      expect(screen.getByTestId('overlay')).toHaveTextContent('task');
    });
  });
});
