import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs.js';

const items = [
  { id: 'topic', label: 'По теме' },
  { id: 'mistakes', label: 'Мои ошибки' },
  { id: 'smart', label: 'Умная', disabled: true },
];

describe('Tabs', () => {
  it('marks the active tab as selected', () => {
    render(
      <Tabs items={items} activeId="topic" onChange={() => {}} aria-label="Режим тренировки" />,
    );
    expect(screen.getByRole('tab', { name: 'По теме' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Мои ошибки' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('switches the active tab on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Tabs items={items} activeId="topic" onChange={onChange} aria-label="Режим тренировки" />,
    );
    await user.click(screen.getByRole('tab', { name: 'Мои ошибки' }));
    expect(onChange).toHaveBeenCalledWith('mistakes');
  });

  it('disables a disabled tab', () => {
    render(
      <Tabs items={items} activeId="topic" onChange={() => {}} aria-label="Режим тренировки" />,
    );
    expect(screen.getByRole('tab', { name: 'Умная' })).toBeDisabled();
  });
});
