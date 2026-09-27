import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubjectMobile } from './SubjectMobile.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { getSubjectContent, getTaskNumbers } from '../../data/subjectContent.js';
import * as api from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  getRandomTask: vi.fn(),
}));

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
  it('renders the hero and topics list by default, matching desktop data', () => {
    renderSubject();
    const content = getSubjectContent('math');
    expect(screen.getAllByText('Математика').length).toBeGreaterThan(0);
    expect(screen.getByText(content.tagline)).toBeInTheDocument();
    for (const topic of content.topics) {
      expect(screen.getAllByText(topic.title).length).toBeGreaterThan(0);
    }
  });

  it('switches to Задания по номерам and shows every task number', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'По номерам' }));
    const numbers = getTaskNumbers('math', 'fipi');
    for (const item of numbers) {
      expect(screen.getByText(`№${item.number}`)).toBeInTheDocument();
    }
  });

  it('switches to Варианты and shows the source picker + number chips', async () => {
    const user = userEvent.setup();
    renderSubject();
    await user.click(screen.getByRole('button', { name: 'Варианты' }));
    expect(screen.getByText('Официальные ФИПИ')).toBeInTheDocument();
    expect(screen.getByText('Выбрать всё')).toBeInTheDocument();
  });

  it('drills into a topic and back returns to the topics list without leaving the page', async () => {
    const user = userEvent.setup();
    renderSubject();
    const content = getSubjectContent('math');
    const firstTopic = content.topics[0]!;
    await user.click(screen.getAllByText(firstTopic.title)[0]!);
    expect(screen.getByRole('button', { name: /Начать тренировку/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getAllByText(content.topics[1]!.title).length).toBeGreaterThan(0);
  });

  it('starting a topic training session navigates to the task overlay', async () => {
    vi.mocked(api.getRandomTask).mockResolvedValue(RANDOM_TASK);
    const user = userEvent.setup();
    renderSubject();
    const content = getSubjectContent('math');
    await user.click(screen.getAllByText(content.topics[0]!.title)[0]!);
    await user.click(screen.getByRole('button', { name: /Начать тренировку/ }));
    await waitFor(() => {
      expect(screen.getByTestId('overlay')).toHaveTextContent('task');
    });
  });
});
