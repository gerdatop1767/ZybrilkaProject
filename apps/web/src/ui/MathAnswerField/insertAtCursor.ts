/**
 * Inserts `text` into `value` at the input's current cursor/selection
 * (replacing any selected range), returning the new value and where
 * the cursor should land. Falls back to appending at the end when the
 * element has no tracked selection (e.g. not yet focused) — never
 * silently drops the insertion.
 */
export function insertAtCursor(
  value: string,
  el: { selectionStart: number | null; selectionEnd: number | null } | null,
  text: string,
  cursorOffsetFromEnd = 0,
): { value: string; cursor: number } {
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + text + value.slice(end);
  const cursor = start + text.length - cursorOffsetFromEnd;
  return { value: next, cursor };
}
