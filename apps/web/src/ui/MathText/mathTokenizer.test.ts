import { describe, expect, it } from 'vitest';
import { tokenizeMathText } from './mathTokenizer.js';

describe('tokenizeMathText', () => {
  it('returns a single text token when there is no math', () => {
    expect(tokenizeMathText('Найдите площадь треугольника.')).toEqual([
      { type: 'text', value: 'Найдите площадь треугольника.' },
    ]);
  });

  it('extracts an inline math span between text', () => {
    expect(tokenizeMathText('Решите уравнение $x^2 = 4$ и запишите корень.')).toEqual([
      { type: 'text', value: 'Решите уравнение ' },
      { type: 'math', value: 'x^2 = 4', block: false },
      { type: 'text', value: ' и запишите корень.' },
    ]);
  });

  it('extracts a block ($$...$$) math span as its own token', () => {
    expect(
      tokenizeMathText('Формула: $$x = \\frac{-b \\pm \\sqrt{D}}{2a}$$ — квадратное уравнение.'),
    ).toEqual([
      { type: 'text', value: 'Формула: ' },
      { type: 'math', value: 'x = \\frac{-b \\pm \\sqrt{D}}{2a}', block: true },
      { type: 'text', value: ' — квадратное уравнение.' },
    ]);
  });

  it('handles multiple math spans in one string', () => {
    expect(tokenizeMathText('$a$ и $b$')).toEqual([
      { type: 'math', value: 'a', block: false },
      { type: 'text', value: ' и ' },
      { type: 'math', value: 'b', block: false },
    ]);
  });

  it('handles a string that starts or ends with math', () => {
    expect(tokenizeMathText('$x=1$ — ответ')).toEqual([
      { type: 'math', value: 'x=1', block: false },
      { type: 'text', value: ' — ответ' },
    ]);
    expect(tokenizeMathText('Ответ: $x=1$')).toEqual([
      { type: 'text', value: 'Ответ: ' },
      { type: 'math', value: 'x=1', block: false },
    ]);
  });

  it('trims whitespace inside the math delimiters', () => {
    expect(tokenizeMathText('$ x + 1 $')).toEqual([{ type: 'math', value: 'x + 1', block: false }]);
  });
});
