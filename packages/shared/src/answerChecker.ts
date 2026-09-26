/**
 * Server-side answer checking (docs/ARCHITECTURE.md §13 S2: "comma/dot,
 * spaces, ё/е, case, order-insensitive multi-digit answers"). Pure
 * functions, no I/O — the API is the only caller that matters, but
 * nothing here depends on it.
 *
 * This is intentionally simple: exact/normalized string match plus
 * numeric tolerance and order-insensitive multi-value answers. It is
 * NOT a full CAS/interval-set comparator — tasks whose answer needs
 * that (e.g. interval notation) should get a human-reviewed
 * `answerOptions`-based multiple-choice format instead until a richer
 * checker is built.
 */

/** Collapse whitespace, unify punctuation/letters that EGE graders treat as equivalent. */
export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/,/g, '.');
}

/** Splits a multi-value answer like "2; 5" or "2,5" or "2 5" into normalized tokens. */
function tokenize(normalized: string): readonly string[] {
  return normalized
    .split(/[\s;]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .sort();
}

function numericEquals(a: string, b: string): boolean {
  if (a === '' || b === '') return false;
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
  return Math.abs(numA - numB) < 1e-9;
}

/**
 * True when `userAnswer` matches `correctAnswer` after normalization —
 * exact string match, numeric match (so "6" === "6.0"), or, for
 * multi-value answers, the same set of tokens regardless of order.
 */
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (normalizedUser === normalizedCorrect) return true;
  if (numericEquals(normalizedUser, normalizedCorrect)) return true;

  const userTokens = tokenize(normalizedUser);
  const correctTokens = tokenize(normalizedCorrect);
  if (userTokens.length > 1 && userTokens.length === correctTokens.length) {
    return userTokens.every((token, i) => {
      const correctToken = correctTokens[i]!;
      return token === correctToken || numericEquals(token, correctToken);
    });
  }

  return false;
}
