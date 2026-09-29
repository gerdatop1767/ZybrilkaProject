import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  getCustomIllustration,
  getIllustrationKind,
  illustrationReconstructsOriginal,
  listIllustratedTasks,
} from './illustrations.js';

describe('illustration registry', () => {
  it('lists exactly the tasks that have a custom illustration', () => {
    expect([...listIllustratedTasks()].sort()).toEqual(
      ['math:1', 'math:2', 'math:3', 'math:8', 'math:11', 'math:14', 'math:17'].sort(),
    );
  });

  it('returns null for a task with no custom illustration', () => {
    expect(getCustomIllustration('math', 6)).toBeNull();
    expect(getIllustrationKind('math', 6)).toBeNull();
    expect(illustrationReconstructsOriginal('math', 6)).toBe(false);
    // A different subject with the same task number must not collide.
    expect(getCustomIllustration('russian', 1)).toBeNull();
  });

  it.each([
    ['math', 1, 'geometry_2d', true],
    ['math', 2, 'coordinate_plane', false],
    ['math', 3, 'geometry_3d', true],
    ['math', 8, 'function_graph', true],
    ['math', 11, 'function_graph', true],
    ['math', 14, 'geometry_3d', false],
    ['math', 17, 'geometry_2d', false],
  ] as const)(
    'math:%i has kind %s (reconstructsOriginal=%s)',
    (subjectId, taskNumber, kind, reconstructsOriginal) => {
      expect(getIllustrationKind(subjectId, taskNumber)).toBe(kind);
      expect(getCustomIllustration(subjectId, taskNumber)).not.toBeNull();
      expect(illustrationReconstructsOriginal(subjectId, taskNumber)).toBe(reconstructsOriginal);
    },
  );

  it.each([1, 2, 3, 8, 11, 14, 17] as const)(
    'math:%i renders a labelled <svg role="img"> with no errors',
    (taskNumber) => {
      const node = getCustomIllustration('math', taskNumber);
      const { container } = render(<>{node}</>);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg?.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(0);
      expect(svg).toHaveAttribute('viewBox');
    },
  );

  it('reconstructsOriginal=true only for the tasks the source PDF actually prints a diagram for (1, 3, 8, 11)', () => {
    for (const key of ['math:1', 'math:3', 'math:8', 'math:11']) {
      const [subjectId, taskNumber] = key.split(':');
      expect(illustrationReconstructsOriginal(subjectId!, Number(taskNumber))).toBe(true);
    }
    for (const key of ['math:2', 'math:14', 'math:17']) {
      const [subjectId, taskNumber] = key.split(':');
      expect(illustrationReconstructsOriginal(subjectId!, Number(taskNumber))).toBe(false);
    }
  });
});
