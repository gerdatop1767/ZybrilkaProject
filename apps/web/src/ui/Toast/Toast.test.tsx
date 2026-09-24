import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './ToastProvider.js';

function ShowToastButton({
  message = 'Правильно!',
  variant = 'success' as const,
  durationMs,
}: {
  message?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  durationMs?: number;
}) {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show({ variant, message, durationMs })}>
      Показать
    </button>
  );
}

describe('Toast', () => {
  it('renders a toast triggered via useToast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ShowToastButton />
      </ToastProvider>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Показать' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Правильно!');
  });

  it('dismisses when its close button is pressed', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ShowToastButton />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Показать' }));
    await screen.findByRole('status');
    await user.click(screen.getByRole('button', { name: 'Скрыть уведомление' }));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('auto-dismisses after its duration', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ShowToastButton durationMs={30} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Показать' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('throws when useToast is used outside a ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ShowToastButton />)).toThrow(
      'useToast must be used within a ToastProvider',
    );
    consoleError.mockRestore();
  });
});
