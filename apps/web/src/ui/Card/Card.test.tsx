import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card.js';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Прогресс по темам</Card>);
    expect(screen.getByText('Прогресс по темам')).toBeInTheDocument();
  });
});
