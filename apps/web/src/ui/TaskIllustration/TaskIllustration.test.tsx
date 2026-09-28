import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskConditionImage, TaskSolutionIllustration } from './TaskIllustration.js';

describe('TaskConditionImage — the real given figure, shown inside "Условие" (audit Block 5)', () => {
  it('renders the real imageUrl when present', () => {
    render(<TaskConditionImage imageUrl="/tasks/task-08-graph.png" />);
    const img = screen.getByRole('img', { name: 'Иллюстрация к заданию' });
    expect(img).toHaveAttribute('src', '/tasks/task-08-graph.png');
  });

  it('renders nothing when there is no real image', () => {
    const { container } = render(<TaskConditionImage imageUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TaskSolutionIllustration — our reconstruction, never shown as the original condition (audit Block 5)', () => {
  it('renders a custom illustration, labelled, for a task with no real image (e.g. task 14)', () => {
    render(<TaskSolutionIllustration subjectId="math" taskNumber={14} imageUrl={null} />);
    expect(screen.getByText('Иллюстрация к решению')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument(); // the custom <svg role="img">
  });

  it('renders nothing for a task with no custom illustration at all', () => {
    const { container } = render(
      <TaskSolutionIllustration subjectId="math" taskNumber={6} imageUrl={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once a real imageUrl exists, even for a task with a custom SVG (task 11, audit Block 6)', () => {
    const { container } = render(
      <TaskSolutionIllustration
        subjectId="math"
        taskNumber={11}
        imageUrl="/tasks/task-11-graph.png"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
