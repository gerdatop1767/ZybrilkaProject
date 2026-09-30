import { describe, expect, it } from 'vitest';
import { insertAtCursor } from './insertAtCursor.js';

describe('insertAtCursor', () => {
  it('appends at the end when there is no tracked selection (e.g. not focused yet)', () => {
    const { value, cursor } = insertAtCursor('abc', null, 'π');
    expect(value).toBe('abcπ');
    expect(cursor).toBe(4);
  });

  it('inserts at the cursor position, not always at the end', () => {
    const el = { selectionStart: 1, selectionEnd: 1 };
    const { value, cursor } = insertAtCursor('ac', el, 'b');
    expect(value).toBe('abc');
    expect(cursor).toBe(2);
  });

  it('replaces a selected range instead of inserting alongside it', () => {
    const el = { selectionStart: 1, selectionEnd: 3 };
    const { value, cursor } = insertAtCursor('aXXd', el, 'bc');
    expect(value).toBe('abcd');
    expect(cursor).toBe(3);
  });

  it('supports a cursor offset from the end, e.g. landing between "sin(" and ")"', () => {
    const el = { selectionStart: 0, selectionEnd: 0 };
    const { value, cursor } = insertAtCursor('', el, 'sin()', 1);
    expect(value).toBe('sin()');
    expect(cursor).toBe(4); // right before the closing paren
  });
});
