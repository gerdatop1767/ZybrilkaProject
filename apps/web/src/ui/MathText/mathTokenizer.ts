export interface MathToken {
  type: 'text' | 'math';
  value: string;
  /** Only for `type: 'math'` — `$$...$$` renders as its own display block, `$...$` renders inline. */
  block?: boolean;
}

/**
 * Splits EGE task content on `$$...$$` (block) and `$...$` (inline)
 * LaTeX delimiters — the source content is a mix of Russian prose and
 * formulas ("Найдите $f(3)$, если ..."), never one giant formula, so
 * only the delimited spans become math and everything else stays
 * plain text. `$` is reserved exclusively for this — the content
 * never needs it for anything else (prices are written "руб.").
 */
export function tokenizeMathText(text: string): readonly MathToken[] {
  const tokens: MathToken[] = [];
  const pattern = /\$\$([^$]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const [, block, inline] = match;
    if (block !== undefined) {
      tokens.push({ type: 'math', value: block.trim(), block: true });
    } else {
      tokens.push({ type: 'math', value: inline!.trim(), block: false });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return tokens;
}
