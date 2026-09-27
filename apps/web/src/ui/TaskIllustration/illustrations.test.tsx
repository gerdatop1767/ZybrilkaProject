import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  getCustomIllustration,
  getIllustrationKind,
  listIllustratedTasks,
} from './illustrations.js';

describe('illustration registry', () => {
  it('lists exactly the tasks that have a custom illustration', () => {
    expect([...listIllustratedTasks()].sort()).toEqual(
      ['math:1', 'math:2', 'math:3', 'math:11', 'math:14', 'math:17'].sort(),
    );
  });

  it('returns null for a task with no custom illustration', () => {
    expect(getCustomIllustration('math', 6)).toBeNull();
    expect(getIllustrationKind('math', 6)).toBeNull();
    // A different subject with the same task number must not collide.
    expect(getCustomIllustration('russian', 1)).toBeNull();
  });

  it.each([
    ['math', 1, 'geometry_2d'],
    ['math', 2, 'coordinate_plane'],
    ['math', 3, 'geometry_3d'],
    ['math', 11, 'function_graph'],
    ['math', 14, 'geometry_3d'],
    ['math', 17, 'geometry_2d'],
  ] as const)('math:%i has kind %s', (subjectId, taskNumber, kind) => {
    expect(getIllustrationKind(subjectId, taskNumber)).toBe(kind);
    expect(getCustomIllustration(subjectId, taskNumber)).not.toBeNull();
  });

  it.each([1, 2, 3, 11, 14, 17] as const)(
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
});
