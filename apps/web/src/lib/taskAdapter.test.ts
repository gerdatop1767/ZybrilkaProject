import { describe, expect, it } from 'vitest';
import { explanationForPart, splitMultiPartExplanation } from './taskAdapter.js';

describe('splitMultiPartExplanation', () => {
  it('splits on ### headings, trimming heading and body', () => {
    const sections = splitMultiPartExplanation('### А\nТекст А.\n\n### Б и В\nТекст Б и В.');
    expect(sections).toEqual([
      { heading: 'А', text: 'Текст А.' },
      { heading: 'Б и В', text: 'Текст Б и В.' },
    ]);
  });

  it('keeps a multi-word heading intact, not truncated to its first character', () => {
    const sections = splitMultiPartExplanation('### Многословный заголовок\nТело.');
    expect(sections[0]!.heading).toBe('Многословный заголовок');
  });

  it('falls back to one unheaded section when there are no ### markers', () => {
    const sections = splitMultiPartExplanation('Обычное объяснение без частей.');
    expect(sections).toEqual([{ heading: '', text: 'Обычное объяснение без частей.' }]);
  });
});

describe('explanationForPart', () => {
  const sections = [
    { heading: 'А', text: 'Текст А.' },
    { heading: 'Б и В', text: 'Текст Б и В.' },
  ];

  it('matches a section whose heading contains the part label, case-insensitively', () => {
    expect(explanationForPart(sections, 'а')).toBe('Текст А.');
  });

  it('matches a shared heading for more than one part label', () => {
    expect(explanationForPart(sections, 'б')).toBe('Текст Б и В.');
    expect(explanationForPart(sections, 'в')).toBe('Текст Б и В.');
  });

  it('falls back to every section joined when no heading names the part', () => {
    expect(explanationForPart(sections, 'г')).toBe('Текст А.\n\nТекст Б и В.');
  });
});
