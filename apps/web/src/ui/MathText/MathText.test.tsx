import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineMathText, MathText } from './MathText.js';

describe('MathText / InlineMathText — real KaTeX typography', () => {
  it('renders a $...$ span as KaTeX, not plain text', () => {
    render(<InlineMathText text="Найдите $\dfrac{a}{b}$." />);
    expect(document.querySelector('.katex')).toBeInTheDocument();
  });

  it('renders plain text unchanged when there is no $...$ span', () => {
    render(<InlineMathText text="Обычный текст без формул." />);
    expect(screen.getByText('Обычный текст без формул.')).toBeInTheDocument();
    expect(document.querySelector('.katex')).not.toBeInTheDocument();
  });

  it('MathText splits blank-line-separated paragraphs into separate <p> blocks', () => {
    const { container } = render(<MathText text={'Шаг 1.\n\nШаг 2.'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });
});

describe('KatexSpan — scroll affordance for oversized formulas (EGE Fidelity Final Polish, Block 2)', () => {
  it('wraps every formula in a scroll-cue wrapper with data-scrollable state', () => {
    render(<InlineMathText text="$x^2$" />);
    const wrap = document.querySelector('[data-scrollable]');
    expect(wrap).toBeInTheDocument();
    // jsdom never actually lays out content, so scrollWidth === clientWidth
    // (both 0) — this formula reports as not overflowing, same as any
    // formula that genuinely fits its box in a real browser.
    expect(wrap).toHaveAttribute('data-scrollable', 'false');
  });

  it('does not throw when ResizeObserver fires/unmounts (jsdom has no real layout, so this only checks lifecycle safety)', () => {
    const { unmount } = render(<InlineMathText text="$\sqrt{15x} = 1\dfrac{2}{3}x$" />);
    expect(document.querySelector('.katex')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  it('a $$...$$ block formula gets the block wrapper variant', () => {
    render(<MathText text="$$a^2+b^2=c^2$$" />);
    expect(document.querySelector('.katex-display')).toBeInTheDocument();
  });
});
