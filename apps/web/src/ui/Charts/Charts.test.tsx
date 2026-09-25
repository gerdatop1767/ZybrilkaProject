import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from './BarChart.js';
import { LineChart } from './LineChart.js';
import { DonutChart } from './DonutChart.js';
import { RankedBarList } from './RankedBarList.js';

describe('BarChart', () => {
  it('renders one bar per point', () => {
    const { container } = render(
      <BarChart
        points={[
          { label: 'Пн', value: 4 },
          { label: 'Вт', value: 8 },
        ]}
      />,
    );
    expect(container.querySelectorAll('[title]')).toHaveLength(2);
    expect(screen.getByText('Пн')).toBeInTheDocument();
  });
});

describe('LineChart', () => {
  it('renders a dot per point', () => {
    const { container } = render(
      <LineChart
        points={[
          { label: '1 сен', value: 40 },
          { label: '2 сен', value: 60 },
        ]}
      />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });
});

describe('DonutChart', () => {
  it('renders a legend row per segment', () => {
    render(
      <DonutChart
        ariaLabel="Распределение по темам"
        segments={[
          { label: 'Неравенства', value: 7, percent: 29, color: 'var(--chart-1)' },
          { label: 'Функции', value: 5, percent: 21, color: 'var(--chart-2)' },
        ]}
      />,
    );
    expect(screen.getByText('Неравенства')).toBeInTheDocument();
    expect(screen.getByText('29%')).toBeInTheDocument();
  });
});

describe('RankedBarList', () => {
  it('numbers rows in order', () => {
    render(
      <RankedBarList
        items={[
          { label: 'Стереометрия', value: 42, color: 'var(--color-error)' },
          { label: 'Вероятность', value: 38, color: 'var(--chart-3)' },
        ]}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('1');
    expect(rows[0]).toHaveTextContent('Стереометрия');
    expect(rows[1]).toHaveTextContent('2');
  });
});
