import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatTile } from './StatTile.js';
import { TaskNumberBars } from './TaskNumberBars.js';
import { TopicProgressRow } from './TopicProgressRow.js';
import { MockExamCard, NewMockExamCard } from './MockExamCard.js';

describe('StatTile', () => {
  it('renders the label and a positive delta', () => {
    render(
      <StatTile
        icon="variant"
        iconColor="var(--color-accent-primary)"
        label="Решено заданий"
        value={187}
        deltaLabel="+32%"
        deltaDirection="up"
      />,
    );
    expect(screen.getByText('Решено заданий')).toBeInTheDocument();
    expect(screen.getByText('+32%')).toBeInTheDocument();
  });

  it('renders a string value as-is', () => {
    render(
      <StatTile
        icon="time"
        iconColor="var(--color-warning)"
        label="Среднее время"
        value="2 мин 14 сек"
      />,
    );
    expect(screen.getByText('2 мин 14 сек')).toBeInTheDocument();
  });
});

describe('TaskNumberBars', () => {
  it('calls onSelect with the tapped task number', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <TaskNumberBars
        rows={[
          { number: 1, percent: 90, status: 'strong' },
          { number: 7, percent: 40, status: 'weak' },
        ]}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole('listitem', { name: /Задание 7/ }));
    expect(onSelect).toHaveBeenCalledWith(7);
  });
});

describe('TopicProgressRow', () => {
  it('shows the topic and mastery percent', () => {
    render(<TopicProgressRow icon="topicFunctions" topic="Функции" masteryPercent={65} />);
    expect(screen.getByText('Функции')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });
});

describe('MockExamCard', () => {
  it('renders the exam score', () => {
    render(
      <MockExamCard
        exam={{
          id: 'e1',
          label: 'Пробник №1',
          date: '12 сентября',
          percent: 72,
          correct: 18,
          total: 25,
        }}
      />,
    );
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('18 из 25')).toBeInTheDocument();
  });

  it('renders the "new exam" affordance', () => {
    render(<NewMockExamCard />);
    expect(screen.getByRole('button', { name: /Новый пробник/ })).toBeInTheDocument();
  });
});
