import { FunctionGraphSVG } from './FunctionGraphSVG.js';

/**
 * Task 11's graph: f(x) = ax²+bx+c with roots at x=-4 and x=-1 and
 * f(0)=4 (as read off the printed graph) — solving for a with those
 * three facts gives a=1, so f(x)=(x+4)(x+1) exactly matches the
 * original's graph. Plotted for real, not approximated.
 */
export function Task11ParabolaSVG() {
  const f = (x: number) => (x + 4) * (x + 1);

  return (
    <FunctionGraphSVG
      fn={f}
      xMin={-6}
      xMax={3}
      yMin={-3}
      yMax={10}
      points={[
        { x: -4, y: 0, label: '(-4; 0)', labelOffset: { dx: -20, dy: -12 } },
        { x: -1, y: 0, label: '(-1; 0)', labelOffset: { dx: -54, dy: -8 } },
        { x: 0, y: 4, label: '(0; 4)', labelOffset: { dx: 6, dy: -6 } },
      ]}
      ariaLabel="График функции f(x) = ax² + bx + c с корнями -4 и -1 и точкой (0; 4)"
    />
  );
}
