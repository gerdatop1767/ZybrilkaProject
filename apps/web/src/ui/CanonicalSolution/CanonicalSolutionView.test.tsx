import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalSolutionDto } from '@zybrilka/shared';
import { CanonicalSolutionView } from './CanonicalSolutionView.js';

function makeDto(overrides: Partial<CanonicalSolutionDto> = {}): CanonicalSolutionDto {
  return {
    templateId: 'math.13.equation',
    templateVersion: '1.0.0',
    parts: [
      {
        id: 'a',
        label: 'а)',
        hasCheckableAnswer: true,
        answer: 'x=πn',
        steps: [{ id: 'a1', title: 'Приводим к системе', explanation: 'Условие $B\\geqslant 0$.' }],
      },
      {
        id: 'b',
        label: 'б)',
        hasCheckableAnswer: true,
        answer: '-4π; -3π; -8π/3',
        steps: [
          { id: 'b1', title: 'Отбираем корни', explanation: 'На отрезке $[-4\\pi;-5\\pi/2]$.' },
        ],
      },
    ],
    criticalPoints: [
      {
        id: 'part-a-required',
        text: 'Без ответа на пункт а) всё задание оценивается в 0 баллов.',
        category: 'exam_scoring',
        required: true,
        partId: 'a',
        source: 'fipi_verified',
        status: 'satisfied',
      },
    ],
    validation: { status: 'validated', results: [{ ruleId: 'has-both-parts', passed: true }] },
    ...overrides,
  };
}

describe('CanonicalSolutionView', () => {
  it('(A) renders nothing when there are no parts', () => {
    const { container } = render(
      <CanonicalSolutionView canonicalSolution={makeDto({ parts: [], criticalPoints: [] })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('(B) a single part renders correctly', () => {
    render(
      <CanonicalSolutionView
        canonicalSolution={makeDto({
          parts: [
            {
              id: 'main',
              label: 'Решение',
              hasCheckableAnswer: true,
              steps: [{ id: 's1', title: 'Шаг', explanation: 'Текст шага.' }],
            },
          ],
          criticalPoints: [],
        })}
      />,
    );
    expect(screen.getByText('Эталонное решение')).toBeInTheDocument();
    expect(screen.getByText('Решение')).toBeInTheDocument();
    expect(screen.getByText('Шаг')).toBeInTheDocument();
  });

  it('(C) two parts render, in order', () => {
    render(<CanonicalSolutionView canonicalSolution={makeDto()} />);
    const labels = screen.getAllByRole('heading', { level: 4 }).map((el) => el.textContent);
    expect(labels).toEqual(['а)', 'б)']);
  });

  it('(D) steps render from the steps array, not hardcoded', () => {
    render(
      <CanonicalSolutionView
        canonicalSolution={makeDto({
          parts: [
            {
              id: 'a',
              label: 'а)',
              hasCheckableAnswer: true,
              steps: [
                { id: 's1', title: 'Первый шаг', explanation: 'Текст 1' },
                { id: 's2', title: 'Второй шаг', explanation: 'Текст 2' },
                { id: 's3', title: 'Третий шаг', explanation: 'Текст 3' },
              ],
            },
          ],
          criticalPoints: [],
        })}
      />,
    );
    expect(screen.getByText('Первый шаг')).toBeInTheDocument();
    expect(screen.getByText('Второй шаг')).toBeInTheDocument();
    expect(screen.getByText('Третий шаг')).toBeInTheDocument();
  });

  it('(E) critical points render as plain, user-facing text', () => {
    render(<CanonicalSolutionView canonicalSolution={makeDto()} />);
    expect(screen.getByText('Что важно на ЕГЭ')).toBeInTheDocument();
    expect(
      screen.getByText('Без ответа на пункт а) всё задание оценивается в 0 баллов.'),
    ).toBeInTheDocument();
  });

  it('(F) no criticalPoints -> the block is absent entirely', () => {
    render(<CanonicalSolutionView canonicalSolution={makeDto({ criticalPoints: [] })} />);
    expect(screen.queryByText('Что важно на ЕГЭ')).not.toBeInTheDocument();
  });

  it('(G) examWriteup present -> the block renders', () => {
    render(
      <CanonicalSolutionView canonicalSolution={makeDto({ examWriteup: 'Ответ: $x=\\pi n$.' })} />,
    );
    expect(screen.getByText('Как записать на ЕГЭ')).toBeInTheDocument();
  });

  it('(H) examWriteup absent -> the block is absent entirely', () => {
    render(<CanonicalSolutionView canonicalSolution={makeDto({ examWriteup: undefined })} />);
    expect(screen.queryByText('Как записать на ЕГЭ')).not.toBeInTheDocument();
  });

  it('(I) raw LaTeX delimiters never appear as plain text — rendered through the math renderer', () => {
    const { container } = render(
      <CanonicalSolutionView
        canonicalSolution={makeDto({
          examWriteup: 'Ответ: $x=\\pi n$.',
          parts: [
            {
              id: 'a',
              label: 'а)',
              hasCheckableAnswer: true,
              steps: [
                { id: 's1', title: 'Шаг', explanation: 'Условие $B\\geqslant 0$ обязательно.' },
              ],
            },
          ],
        })}
      />,
    );
    expect(container.textContent).not.toContain('$x=');
    expect(container.textContent).not.toContain('$B\\geqslant');
    // KaTeX renders into elements carrying its own class — confirms the
    // math renderer actually ran, not that the text was merely omitted.
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(0);
  });

  it('never leaks internal fields (category/source/status/ruleId) as visible text', () => {
    render(<CanonicalSolutionView canonicalSolution={makeDto()} />);
    const text = document.body.textContent ?? '';
    for (const leaked of [
      'fipi_verified',
      'project_quality_rule',
      'exam_scoring',
      'has-both-parts',
    ]) {
      expect(text).not.toContain(leaked);
    }
  });
});
