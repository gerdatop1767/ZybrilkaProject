import { FunctionGraphSVG } from './FunctionGraphSVG.js';

/**
 * Task 11's graph: f(x) = ax²+bx+c with roots at x=-4 and x=-1 and
 * f(0)=4 (as read off the printed graph) — solving for a with those
 * three facts gives a=1, so f(x)=(x+4)(x+1) exactly matches the
 * original's graph. Plotted for real, not approximated.
 *
 * The printed original marks only the unit tick (0 and 1 on each
 * axis) and the three points themselves as bare dots — no coordinate
 * text next to them. So this reproduces exactly that: unitOnly tick
 * labels, no per-point labels, nothing invented beyond the source.
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
      tickLabels="unitOnly"
      points={[
        { x: -4, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 4 },
      ]}
      ariaLabel="График функции f(x) = ax² + bx + c с двумя отмеченными корнями и точкой пересечения с осью Oy"
    />
  );
}
