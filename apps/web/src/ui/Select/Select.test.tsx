import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select.js';

const options = [
  { value: 'math', label: 'Математика' },
  { value: 'physics', label: 'Физика' },
];

describe('Select', () => {
  it('opens the option sheet on tap', async () => {
    const user = userEvent.setup();
    render(<Select label="Предмет" options={options} value={null} onChange={() => {}} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Выберите/ }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('selects an option and closes the sheet', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Предмет" options={options} value={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /Выберите/ }));
    await user.click(screen.getByRole('option', { name: 'Физика' }));
    expect(onChange).toHaveBeenCalledWith('physics');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is disabled and does not open', async () => {
    const user = userEvent.setup();
    render(<Select label="Предмет" options={options} value={null} onChange={() => {}} disabled />);
    const trigger = screen.getByRole('button', { name: /Выберите/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
