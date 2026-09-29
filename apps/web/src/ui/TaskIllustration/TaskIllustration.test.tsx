import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskExamIllustration, TaskSolutionIllustration } from './TaskIllustration.js';

describe('TaskExamIllustration — our SVG reconstruction of a real original diagram (EGE Fidelity audit)', () => {
  it('renders the verified SVG inside "Условие" for a task whose source material has a diagram (e.g. task 11)', () => {
    render(<TaskExamIllustration subjectId="math" taskNumber={11} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('never renders a raster image — only our own SVG, or nothing', () => {
    const { container } = render(<TaskExamIllustration subjectId="math" taskNumber={11} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nothing for a task whose SVG is only a solving aid (no original diagram, e.g. task 14)', () => {
    const { container } = render(<TaskExamIllustration subjectId="math" taskNumber={14} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a task with no custom illustration at all', () => {
    const { container } = render(<TaskExamIllustration subjectId="math" taskNumber={6} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TaskSolutionIllustration — our solving aid, never shown as the original condition (audit Block 5)', () => {
  it('renders a labelled custom illustration for a task with no real diagram (e.g. task 14)', () => {
    render(<TaskSolutionIllustration subjectId="math" taskNumber={14} />);
    expect(screen.getByText('Иллюстрация к решению')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders nothing for a task whose SVG already reconstructs a real original diagram (e.g. task 11)', () => {
    const { container } = render(<TaskSolutionIllustration subjectId="math" taskNumber={11} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a task with no custom illustration at all', () => {
    const { container } = render(<TaskSolutionIllustration subjectId="math" taskNumber={6} />);
    expect(container).toBeEmptyDOMElement();
  });
});
