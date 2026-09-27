import { CoordinatePlaneSVG } from './CoordinatePlaneSVG.js';

/** Task 2's own vectors, plotted exactly at their given coordinates. */
export function Task2VectorsSVG() {
  return (
    <CoordinatePlaneSVG
      xMin={-4}
      xMax={2}
      yMin={-10}
      yMax={3}
      vectors={[
        { x: -3, y: 2, label: 'a(-3; 2)', color: '#2563eb' },
        { x: -1, y: -9, label: 'b(-1; -9)', color: '#dc2626' },
      ]}
      ariaLabel="Векторы a(-3; 2) и b(-1; -9), отложенные от начала координат"
    />
  );
}
