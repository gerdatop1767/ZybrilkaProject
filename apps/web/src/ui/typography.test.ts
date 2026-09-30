import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(resolve(import.meta.dirname, './global.css'), 'utf8');

/** Extracts a top-level CSS rule's body by class selector, e.g. `.text-h1 { ... }`. */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = globalCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No CSS rule found for selector "${selector}"`);
  return match[1]!;
}

/**
 * QA v2 Block L: two separate font layers must stay separate at the
 * source level — the UI display font (`--font-family-display`,
 * Unbounded) is for heading/hero chrome only, never for EGE task
 * content, KaTeX math, or anything MathText renders. Reading the
 * actual global.css rules (rather than a jsdom-rendered computed
 * style, which this project's test setup doesn't apply real CSS for —
 * no other test in the suite asserts on computed style) is what
 * actually guards this architectural boundary: if someone later adds
 * `font-family: var(--font-family-display)` to `.text-task`,
 * `.text-explanation` or `.katex`, this test fails immediately.
 */
describe('UI display typography never reaches EGE task/math content (QA v2 Block L)', () => {
  it('.text-task (task condition) does not set font-family', () => {
    expect(ruleBody('.text-task')).not.toMatch(/font-family/);
  });

  it('.text-explanation (solution steps) does not set font-family', () => {
    expect(ruleBody('.text-explanation')).not.toMatch(/font-family/);
  });

  it('.katex (KaTeX-rendered math) does not set font-family', () => {
    expect(ruleBody('.katex')).not.toMatch(/font-family/);
  });

  it('.text-body / .text-body-sm / .text-label stay on the base UI font, not display', () => {
    for (const selector of ['.text-body', '.text-body-sm', '.text-label']) {
      expect(ruleBody(selector)).not.toMatch(/font-family/);
    }
  });

  it('UI headings and hero/stat numbers do use the display font', () => {
    for (const selector of ['.text-h1', '.text-h2', '.text-h3', '.text-hero', '.text-stat']) {
      expect(ruleBody(selector)).toMatch(/font-family:\s*var\(--font-family-display\)/);
    }
  });

  it('body sets the base font, and the display font is a distinct token', () => {
    expect(globalCss).toMatch(/font-family:\s*var\(--font-family-base\)/);
  });
});
