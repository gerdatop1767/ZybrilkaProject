import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackState } from './FeedbackState.js';

describe('FeedbackState', () => {
  it('renders a success state', () => {
    render(<FeedbackState variant="success" title="Правильно!" description="Отличная работа!" />);
    expect(screen.getByRole('status')).toHaveTextContent('Правильно!');
    expect(screen.getByText('Отличная работа!')).toBeInTheDocument();
  });

  it('renders an error state with an encouraging tone, not an alert role', () => {
    render(<FeedbackState variant="error" title="Неверно" description="Попробуй похожую задачу" />);
    const feedback = screen.getByRole('status');
    expect(feedback).toHaveTextContent('Неверно');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
