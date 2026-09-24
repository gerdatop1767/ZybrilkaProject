import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatRow } from './StatRow.js';

describe('StatRow', () => {
  it('renders each item’s value and label', () => {
    render(
      <StatRow
        items={[
          { id: 'xp', value: '642', label: 'XP' },
          { id: 'streak', value: '12', label: 'Дней подряд' },
        ]}
      />,
    );
    expect(screen.getByText('642')).toBeInTheDocument();
    expect(screen.getByText('XP')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Дней подряд')).toBeInTheDocument();
  });
});
