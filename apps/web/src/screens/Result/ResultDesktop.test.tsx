import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultDesktop } from './ResultDesktop.js';
import { sampleTask } from '../../data/sampleTask.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';
import { userStats } from '../../data/sampleProgress.js';
import { getStreakAsset } from '../../lib/rank.js';

function OverlayMarker() {
  const { overlay } = useNavigation();
  return <p data-testid="overlay">{overlay?.screen ?? 'none'}</p>;
}

function renderResult(
  correct: boolean,
  userAnswer = correct ? sampleTask.correctAnswer : '(−∞; 2]',
) {
  return render(
    <NavigationProvider>
      <ResultDesktop
        subjectId={sampleTask.subjectId}
        taskNumber={sampleTask.number}
        taskId={sampleTask.id}
        correct={correct}
        userAnswer={userAnswer}
      />
      <OverlayMarker />
    </NavigationProvider>,
  );
}

describe('ResultDesktop — correct state', () => {
  it('shows the success banner and the sidebar result card', () => {
    renderResult(true);
    expect(screen.getAllByText('Правильно!').length).toBeGreaterThan(0);
    expect(screen.getByText('Результат')).toBeInTheDocument();
    expect(screen.getByText('Задания в теме')).toBeInTheDocument();
  });

  it('shows all solution steps without a краткое/подробное toggle', () => {
    renderResult(true);
    for (const step of sampleTask.steps) {
      expect(screen.getByText(step.text)).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Краткое решение' })).not.toBeInTheDocument();
  });

  it('navigates to the next task', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await user.click(screen.getByRole('button', { name: /Следующее задание/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});

describe('ResultDesktop — incorrect state', () => {
  it('shows a calm error banner with both answers and the solution toggle', () => {
    renderResult(false);
    expect(screen.getAllByText('Неверно').length).toBeGreaterThan(0);
    expect(screen.getByText('Правильный ответ:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Краткое решение' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подробное решение' })).toBeInTheDocument();
  });

  it('switches between brief and detailed solutions', async () => {
    const user = userEvent.setup();
    renderResult(false);
    // Detailed is the default — all steps visible.
    expect(screen.getByText(sampleTask.steps[0]!.text)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Краткое решение' }));
    expect(screen.queryByText(sampleTask.steps[0]!.text)).not.toBeInTheDocument();
    expect(screen.getByText(sampleTask.steps.at(-1)!.text)).toBeInTheDocument();
  });

  it('shows the "Полезно знать" hint tip', () => {
    renderResult(false);
    expect(screen.getByText('Полезно знать')).toBeInTheDocument();
    expect(screen.getByText(sampleTask.hint)).toBeInTheDocument();
  });
});

describe('ResultDesktop — badges', () => {
  it('uses the shared StreakBadge PNG for the streak reward chip, never an emoji', () => {
    renderResult(true);
    expect(
      document.querySelector(`img[src="${getStreakAsset(userStats.streakDays)}"]`),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/🔥/);
  });
});
