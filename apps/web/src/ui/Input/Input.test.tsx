import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input.js';

describe('Input', () => {
  it('renders with a label and placeholder', () => {
    render(<Input label="Имя" placeholder="Алексей" />);
    expect(screen.getByLabelText('Имя')).toHaveAttribute('placeholder', 'Алексей');
  });

  it('receives focus and text input', async () => {
    const user = userEvent.setup();
    render(<Input label="Ответ" />);
    const input = screen.getByLabelText('Ответ');
    await user.click(input);
    await user.keyboard('100');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('100');
  });

  it('shows the error state and message', () => {
    render(<Input label="Ответ" errorText="Введите число" />);
    const input = screen.getByLabelText('Ответ');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Введите число')).toBeInTheDocument();
  });

  it('is disabled and not editable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Ответ" disabled onChange={onChange} />);
    const input = screen.getByLabelText('Ответ');
    expect(input).toBeDisabled();
    await user.click(input);
    expect(input).not.toHaveFocus();
  });
});
