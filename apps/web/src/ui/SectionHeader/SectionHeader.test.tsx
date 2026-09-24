import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionHeader } from './SectionHeader.js';

describe('SectionHeader', () => {
  it('renders the title and an optional eyebrow', () => {
    render(<SectionHeader eyebrow="Сегодня" title="Твой прогресс" />);
    expect(screen.getByRole('heading', { name: 'Твой прогресс' })).toBeInTheDocument();
    expect(screen.getByText('Сегодня')).toBeInTheDocument();
  });

  it('calls the trailing action when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SectionHeader title="Достижения" action={{ label: 'Все', onClick }} />);
    await user.click(screen.getByRole('button', { name: 'Все' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
