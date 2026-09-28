import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectDesktop } from './SubjectDesktop.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getRandomTask: vi.fn(),
  listCollections: vi.fn(),
  getProgressByTaskNumber: vi.fn(),
  getProgressByTopic: vi.fn(),
}));

// Every render starts on the 'topics' mode, so its effect always fires
// regardless of which mode a given test actually exercises — a neutral
// default keeps unrelated tests from needing to know about topics.
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

function mockProgress(items: readonly { taskNumber: number; total: number; completed: number }[]) {
  vi.mocked(api.getProgressByTaskNumber).mockResolvedValue({
    items: items.map((i) => ({ subjectId: 'math', ...i })),
  });
}

function aggregateProgress() {
  // 19 numbers, aggregate bank: total 3 each (arbitrary but > 0 so tiles are clickable).
  return Array.from({ length: 19 }, (_, i) => ({
    taskNumber: i + 1,
    total: 3,
    completed: i === 0 ? 1 : 0,
  }));
}

function yashchenkoOnlyProgress() {
  // Scoped to the one collection: exactly 1 task per number.
  return Array.from({ length: 19 }, (_, i) => ({ taskNumber: i + 1, total: 1, completed: 0 }));
}

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderSubject() {
  return render(
    <NavigationProvider>
      <SubjectDesktop subjectId="math" from="subjectCatalog" />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('SubjectDesktop — hero icon and glow', () => {
  it('renders the real subject illustration instead of the old glyph tile', () => {
    mockCollections();
    mockProgress(aggregateProgress());
    renderSubject();
    const img = document.querySelector('img[src="/branding/v2/subjects/math.png"]');
    expect(img).toBeInTheDocument();
    // No leftover SubjectTile glyph (rendered as an inline SVG/lucide
    // icon) inside the hero — the image itself carries the artwork now.
    expect(img!.parentElement!.querySelector('svg')).not.toBeInTheDocument();
  });
});

describe('SubjectDesktop — Задания по номерам source filter (real API, no fake hash)', () => {
  it('shows a real "Общий банк" + collection selector, and switching source refetches real counts', async () => {
    mockCollections();
    vi.mocked(api.getProgressByTaskNumber).mockImplementation(({ collection }) =>
      Promise.resolve({
        items: (collection ? yashchenkoOnlyProgress() : aggregateProgress()).map((i) => ({
          subjectId: 'math',
          ...i,
        })),
      }),
    );
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    expect(screen.getByText('Выбери номер задания ЕГЭ')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Общий банк')).toBeInTheDocument());

    const before = await waitFor(() => screen.getByText('№1').closest('button')!.textContent);
    expect(before).toContain('1/3'); // aggregate: completed=1, total=3

    await user.click(screen.getByRole('button', { name: 'Общий банк' }));
    await user.click(screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await waitFor(() => {
      expect(screen.getByText('№1').closest('button')!.textContent).toContain('0/1');
    });
    expect(api.getProgressByTaskNumber).toHaveBeenLastCalledWith({
      subject: 'math',
      collection: 'ege-2026-yashchenko',
    });
  });

  it("shows the real source name in a task number's detail view", async () => {
    mockCollections();
    mockProgress(yashchenkoOnlyProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    await user.click(screen.getByRole('button', { name: 'Общий банк' }));
    await user.click(screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' }));
    await waitFor(() => screen.getByText('№3'));
    await user.click(screen.getByText('№3'));
    expect(screen.getByText(/источник: ЕГЭ 2026 Ященко/)).toBeInTheDocument();
  });

  it('a number with 0 total in the selected source is disabled and shows an empty state', async () => {
    mockCollections();
    mockProgress([{ taskNumber: 1, total: 0, completed: 0 }]);
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    await waitFor(() => screen.getByText('№1'));
    const tile = screen.getByText('№1').closest('button')!;
    expect(tile).toHaveTextContent('Нет заданий');
    expect(tile).toBeDisabled();
  });

  it('back from a number detail returns to the grid, not Предметы', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    await waitFor(() => screen.getByText('№3'));
    await user.click(screen.getByText('№3'));
    const backRow = screen.getAllByRole('button', { name: /Задания по номерам/ })[0]!;
    await user.click(backRow);
    expect(screen.getByText('Выбери номер задания ЕГЭ')).toBeInTheDocument();
  });

  it('starting training passes the selected collection through to getRandomTask', async () => {
    mockCollections();
    mockProgress(yashchenkoOnlyProgress());
    vi.mocked(api.getRandomTask).mockResolvedValue({
      id: 'task-1',
      subjectId: 'math',
      taskNumber: 3,
      topicId: null,
      topicName: null,
      difficulty: 2,
      conditionMd: 'Условие',
      imageUrl: null,
      hintMd: null,
      answerType: 'short_answer',
      answerOptions: null,
      source: 'Ященко',
      sourceUrl: null,
      sourceYear: 2026,
      tags: [],
      status: 'published',
    } as never);
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Задания по номерам'));
    await user.click(screen.getByRole('button', { name: 'Общий банк' }));
    await user.click(screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' }));
    await waitFor(() => screen.getByText('№3'));
    await user.click(screen.getByText('№3'));
    await user.click(screen.getByRole('button', { name: /Начать тренировку по №3/ }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'math',
          taskNumber: 3,
          collection: 'ege-2026-yashchenko',
        }),
      );
    });
    await waitFor(() => expect(screen.getByTestId('overlay')).toHaveTextContent('task'));
  });

  it('falls back to "Общий банк" when the incoming collectionSlug no longer exists', async () => {
    mockCollections([]); // nothing published for this subject
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <SubjectDesktop subjectId="math" from="subjectCatalog" collectionSlug="stale-slug" />
      </NavigationProvider>,
    );
    await user.click(screen.getByText('Задания по номерам'));
    await waitFor(() => expect(screen.getByText('Общий банк')).toBeInTheDocument());
  });
});

describe('SubjectDesktop — Темы (real API, no fake hash)', () => {
  function mockTopics(
    items: { topicId: string; topicName: string; total: number; completed: number }[],
  ) {
    vi.mocked(api.getProgressByTopic).mockResolvedValue({ items });
  }

  it('shows real topics with real X/Y, not the static design-content list', async () => {
    mockCollections();
    mockTopics([{ topicId: 't1', topicName: 'Логарифмы', total: 4, completed: 1 }]);
    renderSubject();
    await waitFor(() => expect(screen.getByText('Логарифмы')).toBeInTheDocument());
    expect(screen.getByText('1 / 4 решено')).toBeInTheDocument();
  });

  it('an empty topic list (e.g. unknown source) shows a neutral empty state, not a fake row', async () => {
    mockCollections();
    mockTopics([]);
    renderSubject();
    await waitFor(() =>
      expect(screen.getByText('В этом источнике пока нет тем.')).toBeInTheDocument(),
    );
  });

  it('switching the topics source selector refetches scoped by the new collection', async () => {
    mockCollections();
    vi.mocked(api.getProgressByTopic).mockImplementation(({ collection }) =>
      Promise.resolve({
        items: collection
          ? [{ topicId: 't-yash', topicName: 'Планиметрия', total: 1, completed: 0 }]
          : [{ topicId: 't-agg', topicName: 'Логарифмы', total: 4, completed: 1 }],
      }),
    );
    const user = userEvent.setup();
    renderSubject();
    await waitFor(() => expect(screen.getByText('Логарифмы')).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Общий банк' })[0]!);
    await user.click(screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' }));

    await waitFor(() => expect(screen.getByText('Планиметрия')).toBeInTheDocument());
    expect(api.getProgressByTopic).toHaveBeenLastCalledWith({
      subject: 'math',
      collection: 'ege-2026-yashchenko',
    });
  });

  it('drilling into a topic and starting training passes its real topicId to getRandomTask', async () => {
    mockCollections();
    mockTopics([{ topicId: 'real-topic-id', topicName: 'Логарифмы', total: 4, completed: 1 }]);
    vi.mocked(api.getRandomTask).mockResolvedValue({
      id: 'task-1',
      subjectId: 'math',
      taskNumber: 9,
      topicId: 'real-topic-id',
      topicName: 'Логарифмы',
      difficulty: 2,
      conditionMd: 'Условие',
      imageUrl: null,
      hintMd: null,
      answerType: 'short_answer',
      answerOptions: null,
      source: 'Ященко',
      sourceUrl: null,
      sourceYear: 2026,
      tags: [],
      status: 'published',
    } as never);
    const user = userEvent.setup();
    renderSubject();
    await waitFor(() => screen.getByText('Логарифмы'));
    await user.click(screen.getByText('Логарифмы'));
    await user.click(screen.getByRole('button', { name: /Начать тренировку/ }));
    await waitFor(() => {
      expect(api.getRandomTask).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'math', topic: 'real-topic-id' }),
      );
    });
  });

  it('a topic with total=0 disables the start button rather than dividing by zero', async () => {
    mockCollections();
    mockTopics([{ topicId: 't1', topicName: 'Пустая тема', total: 0, completed: 0 }]);
    const user = userEvent.setup();
    renderSubject();
    await waitFor(() => screen.getByText('Пустая тема'));
    await user.click(screen.getByText('Пустая тема'));
    expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeDisabled();
  });
});

describe('SubjectDesktop — Случайные задания source filter', () => {
  it('shows the real source selector for random tasks', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Случайные задания'));
    expect(screen.getByText('Общий банк')).toBeInTheDocument();
  });
});

describe('SubjectDesktop — Варианты (real collections, source isolation)', () => {
  it('lets picking individual task numbers and a real collection source, updating the summary', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    expect(
      screen.getByText('Собери собственный вариант из нужных заданий и источников'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Выбрано 2 заданий')).toBeInTheDocument();
    expect(screen.getByText(/Номера: 1, 2/)).toBeInTheDocument();
    expect(screen.getByText(/Источник: Общий банк/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Общий банк' }));
    await user.click(screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' }));
    expect(screen.getByText(/Источник: ЕГЭ 2026 Ященко/)).toBeInTheDocument();
  });

  describe('source isolation', () => {
    const FIPI_COLLECTION = {
      collection: {
        id: 'c2',
        subjectId: 'math',
        slug: 'fipi-2026',
        title: 'ФИПИ 2026',
        publisher: 'ФИПИ',
        year: 2026,
        description: null,
      },
      variants: [
        { id: 'v2', collectionId: 'c2', variantNumber: 1, title: 'Вариант 1', year: 2026 },
      ],
    };

    it('lists Ященко and ФИПИ as two separate, non-duplicated source options', async () => {
      mockCollections([YASHCHENKO_COLLECTION, FIPI_COLLECTION]);
      mockProgress(aggregateProgress());
      const user = userEvent.setup();
      renderSubject();
      await user.click(screen.getByText('Полные варианты ЕГЭ'));
      await user.click(screen.getByRole('button', { name: 'Общий банк' }));
      expect(screen.getAllByRole('option', { name: 'ЕГЭ 2026 Ященко' })).toHaveLength(1);
      expect(screen.getAllByRole('option', { name: 'ФИПИ 2026' })).toHaveLength(1);
    });

    it('does not show Ященко nested under the ФИПИ option or vice versa', async () => {
      mockCollections([YASHCHENKO_COLLECTION, FIPI_COLLECTION]);
      mockProgress(aggregateProgress());
      const user = userEvent.setup();
      renderSubject();
      await user.click(screen.getByText('Полные варианты ЕГЭ'));
      await user.click(screen.getByRole('button', { name: 'Общий банк' }));
      const fipiOption = screen.getByRole('option', { name: 'ФИПИ 2026' });
      expect(fipiOption.textContent).not.toContain('Ященко');
      const yashchenkoOption = screen.getByRole('option', { name: 'ЕГЭ 2026 Ященко' });
      expect(yashchenkoOption.textContent).not.toContain('ФИПИ');
    });

    it('"Общий банк" stays the single aggregate option, not a real collection', async () => {
      mockCollections([YASHCHENKO_COLLECTION, FIPI_COLLECTION]);
      mockProgress(aggregateProgress());
      const user = userEvent.setup();
      renderSubject();
      await user.click(screen.getByText('Полные варианты ЕГЭ'));
      expect(screen.getByText(/Источник: Общий банк/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Общий банк' }));
      expect(screen.getAllByRole('option').length).toBe(3); // Общий банк + Ященко + ФИПИ
    });
  });

  it('"Выбрать всё" selects every task number', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    await user.click(screen.getByRole('button', { name: /Выбрать всё/ }));
    expect(screen.getByText('Выбрано 19 заданий')).toBeInTheDocument();
  });

  it('reset clears the selection', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: /Сбросить/ }));
    expect(screen.getByText('Выбрано 0 заданий')).toBeInTheDocument();
    expect(screen.getByText(/Номера не выбраны/)).toBeInTheDocument();
  });

  it('disables the primary CTA until at least one number is selected', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByText('Полные варианты ЕГЭ'));
    expect(screen.getByRole('button', { name: /Собрать вариант/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByRole('button', { name: /Собрать вариант/ })).toBeEnabled();
  });
});

describe('SubjectDesktop — BackRow', () => {
  it('returns to the parent screen it opened from (subjectCatalog), not the tab underneath', async () => {
    mockCollections();
    mockProgress(aggregateProgress());
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'К предметам' }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('subjectCatalog');
  });
});
