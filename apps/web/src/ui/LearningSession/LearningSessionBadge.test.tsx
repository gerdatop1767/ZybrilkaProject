import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LearningSessionBadge } from './LearningSessionBadge.js';
import type { LearningSessionState } from '../../lib/learningSessionContext.js';

function activeSession(
  overrides: Partial<Extract<LearningSessionState, { status: 'active' }>> = {},
): Extract<LearningSessionState, { status: 'active' }> {
  return {
    status: 'active',
    sessionId: 'session-1',
    subjectId: 'math',
    currentTaskId: 'task-1',
    currentTaskNumber: 5,
    position: 2,
    total: 10,
    ...overrides,
  };
}

describe('LearningSessionBadge', () => {
  it('shows "Тренировка" for a Smart Training session (no variant)', () => {
    render(<LearningSessionBadge session={activeSession()} />);
    expect(screen.getByText('Тренировка · 2 из 10')).toBeInTheDocument();
  });

  it('shows "Вариант N" instead of "Тренировка" for a variant session', () => {
    render(
      <LearningSessionBadge
        session={activeSession({
          variant: { variantId: 'v1', variantNumber: 3, variantTitle: 'Вариант 3' },
        })}
      />,
    );
    expect(screen.getByText('Вариант 3 · 2 из 10')).toBeInTheDocument();
    expect(screen.queryByText(/Тренировка/)).not.toBeInTheDocument();
  });
});
