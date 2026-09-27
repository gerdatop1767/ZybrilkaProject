import { Fragment, useMemo } from 'react';
import katex from 'katex';
import { tokenizeMathText } from './mathTokenizer.js';

/**
 * Renders EGE task content (condition/hint/explanation) as a mix of
 * plain text and real math typesetting — never one giant formula and
 * never plain text for a formula either. `$...$`/`$$...$$` spans go
 * through KaTeX (fractions, roots, powers, indices, ≤/≥/≠, systems,
 * intervals, trig/log/derivative notation, coordinates, ...); the rest
 * renders as ordinary text, with blank lines becoming separate
 * paragraphs (matches how the source content already uses them to
 * separate "Шаг 1. ...\n\nШаг 2. ...").
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const paragraphs = useMemo(() => text.split(/\n{2,}/), [text]);
  return (
    <>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className={className}>
          <MathLine text={paragraph} />
        </p>
      ))}
    </>
  );
}

/**
 * Same math+text mixing as `MathText`, without the paragraph split or
 * wrapping `<p>` — for a single line of content that's already inside
 * its own block element (a step title, a per-part explanation already
 * wrapped in a `<p>`, ...), where nesting another `<p>` would be invalid.
 */
export function InlineMathText({ text }: { text: string }) {
  return <MathLine text={text} />;
}

function MathLine({ text }: { text: string }) {
  const tokens = useMemo(() => tokenizeMathText(text), [text]);
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === 'math') {
          return <KatexSpan key={i} tex={token.value} block={token.block ?? false} />;
        }
        const lines = token.value.split('\n');
        return (
          <Fragment key={i}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

function KatexSpan({ tex, block }: { tex: string; block: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: block,
      });
    } catch {
      // Malformed LaTeX in stored content — fail visibly as plain text
      // rather than crashing the whole task screen.
      return null;
    }
  }, [tex, block]);

  if (html === null) {
    return <>{tex}</>;
  }
  const Tag = block ? 'div' : 'span';
  return <Tag dangerouslySetInnerHTML={{ __html: html }} />;
}
