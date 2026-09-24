import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Collapse, FadeIn, ScaleIn, SlideUp } from './motion.js';

describe('motion primitives', () => {
  it('FadeIn renders its children', () => {
    render(<FadeIn>Содержимое</FadeIn>);
    expect(screen.getByText('Содержимое')).toBeInTheDocument();
  });

  it('SlideUp renders its children', () => {
    render(<SlideUp>Содержимое</SlideUp>);
    expect(screen.getByText('Содержимое')).toBeInTheDocument();
  });

  it('ScaleIn renders its children', () => {
    render(<ScaleIn>Содержимое</ScaleIn>);
    expect(screen.getByText('Содержимое')).toBeInTheDocument();
  });

  it('Collapse hides content from assistive tech when closed', () => {
    const { rerender } = render(
      <Collapse open={false}>
        <p>Пояснение</p>
      </Collapse>,
    );
    expect(screen.getByText('Пояснение').closest('[aria-hidden]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    rerender(
      <Collapse open>
        <p>Пояснение</p>
      </Collapse>,
    );
    expect(screen.getByText('Пояснение').closest('[aria-hidden]')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
  });
});
