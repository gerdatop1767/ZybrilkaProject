import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultMobile } from './ResultMobile.js';
import { sampleTask } from '../../data/sampleTask.js';
import { NavigationProvider, useNavigation } from '../../lib/navigation.js';

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
      <ResultMobile
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

describe('ResultMobile — correct state', () => {
  it('shows the success feedback and the matched answer', () => {
    renderResult(true);
    expect(screen.getByText('Правильно!')).toBeInTheDocument();
    expect(screen.getAllByText(sampleTask.correctAnswer).length).toBeGreaterThan(0);
  });

  it('does not show the reference-answer row when correct', () => {
    renderResult(true);
    expect(screen.queryByText('Правильный ответ:')).not.toBeInTheDocument();
  });

  it('reveals the step-by-step solution', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await user.click(screen.getByRole('button', { name: /Показать решение/ }));
    expect(screen.getByText(sampleTask.steps[0]!.text)).toBeInTheDocument();
  });

  it('navigates to the next task', async () => {
    const user = userEvent.setup();
    renderResult(true);
    await user.click(screen.getByRole('button', { name: /Следующее задание/ }));
    expect(screen.getByTestId('overlay')).toHaveTextContent('task');
  });
});

describe('ResultMobile — incorrect state', () => {
  it('shows a calm error state with the correct answer', () => {
    renderResult(false);
    expect(screen.getByText('Неправильно!')).toBeInTheDocument();
    expect(screen.getByText('Правильный ответ:')).toBeInTheDocument();
    expect(screen.getAllByText(sampleTask.correctAnswer).length).toBeGreaterThan(0);
  });

  it('shows the explanation topic via the meta chip on the task chrome', () => {
    renderResult(false);
    expect(screen.getByText(`Задание №${sampleTask.number}`)).toBeInTheDocument();
  });
});

describe('ResultMobile — shared chrome', () => {
  it('keeps tools and other-variants collapsed by default', () => {
    renderResult(true);
    expect(screen.getByRole('button', { name: /Дополнительные инструменты/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /Другие задания/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
