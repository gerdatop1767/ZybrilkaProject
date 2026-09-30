/**
 * The math keyboard's key set — plain-text insertions only, never
 * LaTeX. This is an input helper for one FINAL ANSWER value (e.g.
 * "-4π; -3π; -8π/3"), not a solution/step editor — see
 * `MathAnswerField.tsx`'s own doc comment for the full boundary.
 *
 * Every `insert` string uses the same plain-text conventions the real
 * task data already uses (`packages/db/src/importEge2026Variant1.ts`
 * `correctAnswer` column — verified across all 19 imported tasks):
 * literal `π`/`√` characters, a plain `/` for fractions, ASCII `-` for
 * minus (not `−` U+2212 — the answer checker's `checkAnswer`
 * (`packages/shared/src/answerChecker.ts`) does an exact/normalized
 * string match and never unifies minus-sign variants, so a different
 * character here would silently stop matching a correct answer typed
 * via the keyboard). The visible button label can still use the nicer
 * `−` glyph — only `insert` has to be the checker-safe ASCII form.
 */
export interface MathKeyboardKey {
  readonly id: string;
  /** What the button shows. */
  readonly label: string;
  /** Plain text inserted at the cursor position. */
  readonly insert: string;
  /** How many characters back from the end of `insert` the cursor lands (0 = right after the inserted text). */
  readonly cursorOffsetFromEnd?: number;
  readonly ariaLabel?: string;
}

export interface MathKeyboardGroup {
  readonly id: string;
  readonly keys: readonly MathKeyboardKey[];
}

function bare(id: string, label: string, insert = label): MathKeyboardKey {
  return { id, label, insert };
}

/** A function/bracket key that inserts `label(` + `)` with the cursor left between the parens. */
function withParens(id: string, label: string): MathKeyboardKey {
  return { id, label, insert: `${label}()`, cursorOffsetFromEnd: 1 };
}

export const mathKeyboardGroups: readonly MathKeyboardGroup[] = [
  {
    id: 'symbols',
    keys: [
      { id: 'sqrt', label: '√', insert: '√' },
      bare('pi', 'π'),
      bare('sq', '²'),
      bare('cube', '³'),
      bare('frac', '/'),
      { id: 'parens', label: '( )', insert: '()', cursorOffsetFromEnd: 1 },
      bare('plus', '+'),
      { id: 'minus', label: '−', insert: '-', ariaLabel: 'минус' },
      bare('eq', '='),
      bare('pm', '±'),
      bare('le', '≤'),
      bare('ge', '≥'),
      bare('inf', '∞'),
      bare('ne', '≠'),
    ],
  },
  {
    id: 'functions',
    keys: [
      withParens('sin', 'sin'),
      withParens('cos', 'cos'),
      withParens('tg', 'tg'),
      withParens('ctg', 'ctg'),
      withParens('log', 'log'),
      withParens('ln', 'ln'),
      bare('union', '∪'),
      bare('intersect', '∩'),
    ],
  },
];
