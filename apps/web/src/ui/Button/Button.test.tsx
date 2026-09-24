import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.js';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Начать тренировку</Button>);
    expect(screen.getByRole('button', { name: 'Начать тренировку' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Проверить</Button>);
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled while loading and does not fire onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Отправка
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Отправка' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
