import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { TaskNumberStatisticsDetail } from '@zybrilka/shared';
import { TaskNumberDetailPanel } from './TaskNumberDetailPanel.js';

const BASE_DETAIL: TaskNumberStatisticsDetail = {
  subjectId: 'math',
  taskNumber: 13,
  attempts: 4,
  uniqueTasksAttempted: 3,
  correctAttempts: 3,
  incorrectAttempts: 1,
  accuracy: 75,
  averageTimeMs: 12000,
  medianTimeMs: 11000,
  timedAttempts: 4,
  lastAttemptAt: new Date().toISOString(),
  taskType: 'Тригонометрические уравнения',
  errorBreakdown: [{ signature: 'incorrect_answer', count: 1 }],
  skillBreakdown: [{ skillId: 's1', skillName: 'Замена переменной', mastery: 60, attempts: 2 }],
  recentAccuracy: null,
  previousAccuracy: null,
  recentAverageTimeMs: null,
  accuracyTrend: [],
  timeTrend: [],
  speedSignal: { value: null, baselineLevel: null, baselineMedianMs: null, sampleSize: 0 },
};

describe('TaskNumberDetailPanel — "Тип задания" (Step 5)', () => {
  it('shows the real topic name as the main block, not an invented error-type label', () => {
    render(<TaskNumberDetailPanel taskNumber={13} detail={BASE_DETAIL} />);
    expect(screen.getByText('Тип задания')).toBeInTheDocument();
    expect(screen.getByText('Тригонометрические уравнения')).toBeInTheDocument();
  });

  it('shows an honest empty state when no topic is tagged, never a fabricated type', () => {
    render(<TaskNumberDetailPanel taskNumber={13} detail={{ ...BASE_DETAIL, taskType: null }} />);
    expect(screen.getByText('Тип задания для этого номера пока не определён.')).toBeInTheDocument();
  });
});

describe('TaskNumberDetailPanel — skills block (Step 6)', () => {
  it('uses a user-facing heading naming the task number, not the technical "Навыки" label', () => {
    render(<TaskNumberDetailPanel taskNumber={13} detail={BASE_DETAIL} />);
    expect(screen.getByText('Какие навыки проверяет №13')).toBeInTheDocument();
    expect(screen.queryByText('Навыки')).not.toBeInTheDocument();
  });

  it('shows real Russian skill names, never technical slugs', () => {
    render(<TaskNumberDetailPanel taskNumber={13} detail={BASE_DETAIL} />);
    expect(screen.getByText('Замена переменной')).toBeInTheDocument();
    expect(screen.queryByText('substitution')).not.toBeInTheDocument();
  });

  it('shows an honest empty state when no skills are tagged, never invented ones', () => {
    render(
      <TaskNumberDetailPanel taskNumber={13} detail={{ ...BASE_DETAIL, skillBreakdown: [] }} />,
    );
    expect(screen.getByText('Для этого номера пока нет размеченных навыков.')).toBeInTheDocument();
  });
});

describe('TaskNumberDetailPanel — error breakdown is now a secondary block (Step 7)', () => {
  it('renames "Частые ошибки" to "Ошибки в ответах" and keeps it below "Тип задания"', () => {
    render(<TaskNumberDetailPanel taskNumber={13} detail={BASE_DETAIL} />);
    expect(screen.queryByText('Частые ошибки')).not.toBeInTheDocument();
    expect(screen.queryByText('Самая популярная ошибка')).not.toBeInTheDocument();
    const headings = screen
      .getAllByText(/^(Тип задания|Ошибки в ответах)$/)
      .map((el) => el.textContent);
    expect(headings.indexOf('Ошибки в ответах')).toBeGreaterThan(headings.indexOf('Тип задания'));
  });

  it('still shows real error-signature labels, not raw codes', () => {
    render(<TaskNumberDetailPanel taskNumber={13} detail={BASE_DETAIL} />);
    expect(screen.getByText('Неверный ответ')).toBeInTheDocument();
  });
});
