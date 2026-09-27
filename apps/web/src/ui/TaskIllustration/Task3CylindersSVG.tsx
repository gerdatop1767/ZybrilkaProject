interface CylinderProps {
  x: number;
  baseY: number;
  radiusX: number;
  height: number;
  radiusLabel: string;
  heightLabel: string;
}

const ELLIPSE_RY_RATIO = 0.28;

function Cylinder({ x, baseY, radiusX, height, radiusLabel, heightLabel }: CylinderProps) {
  const ry = radiusX * ELLIPSE_RY_RATIO;
  const topY = baseY - height;
  return (
    <g>
      {/* Sides */}
      <line
        x1={x - radiusX}
        y1={baseY}
        x2={x - radiusX}
        y2={topY}
        stroke="#111827"
        strokeWidth={1.8}
      />
      <line
        x1={x + radiusX}
        y1={baseY}
        x2={x + radiusX}
        y2={topY}
        stroke="#111827"
        strokeWidth={1.8}
      />
      {/* Bottom ellipse: front arc solid, back arc dashed */}
      <path
        d={`M ${x - radiusX} ${baseY} A ${radiusX} ${ry} 0 0 0 ${x + radiusX} ${baseY}`}
        fill="none"
        stroke="#111827"
        strokeWidth={1.8}
      />
      <path
        d={`M ${x - radiusX} ${baseY} A ${radiusX} ${ry} 0 0 1 ${x + radiusX} ${baseY}`}
        fill="none"
        stroke="#111827"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* Top ellipse: fully visible */}
      <ellipse
        cx={x}
        cy={topY}
        rx={radiusX}
        ry={ry}
        fill="white"
        stroke="#111827"
        strokeWidth={1.8}
      />
      {/* Radius indicator on top ellipse */}
      <line x1={x} y1={topY} x2={x + radiusX} y2={topY} stroke="#2563eb" strokeWidth={1.5} />
      <text x={x + radiusX / 2 - 4} y={topY - 5} fontSize={12} fill="#2563eb">
        {radiusLabel}
      </text>
      {/* Height indicator */}
      <line
        x1={x + radiusX + 14}
        y1={topY}
        x2={x + radiusX + 14}
        y2={baseY}
        stroke="#16a34a"
        strokeWidth={1.2}
      />
      <line
        x1={x + radiusX + 10}
        y1={topY}
        x2={x + radiusX + 18}
        y2={topY}
        stroke="#16a34a"
        strokeWidth={1.2}
      />
      <line
        x1={x + radiusX + 10}
        y1={baseY}
        x2={x + radiusX + 18}
        y2={baseY}
        stroke="#16a34a"
        strokeWidth={1.2}
      />
      <text x={x + radiusX + 20} y={(topY + baseY) / 2 + 4} fontSize={12} fill="#16a34a">
        {heightLabel}
      </text>
    </g>
  );
}

/**
 * Task 3 gives no absolute radius/height, only the ratios between the
 * two cylinders (r₂=r₁/2, h₂=3h₁) — this schematic shows exactly that
 * relationship (cylinder 2 visibly shorter-radius/taller) with
 * symbolic labels, not invented numbers.
 */
export function Task3CylindersSVG() {
  const baseY = 190;
  const r1 = 55;
  const h1 = 70;
  return (
    <svg
      viewBox="0 0 340 220"
      role="img"
      aria-label="Два цилиндра: у второго высота втрое больше, а радиус вдвое меньше, чем у первого"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x={0} y={0} width={340} height={220} fill="white" />

      <Cylinder x={85} baseY={baseY} radiusX={r1} height={h1} radiusLabel="r" heightLabel="h" />
      <Cylinder
        x={255}
        baseY={baseY}
        radiusX={r1 / 2}
        height={h1 * 1.6}
        radiusLabel="r/2"
        heightLabel="3h"
      />

      <text x={45} y={baseY + 22} fontSize={12} textAnchor="middle">
        V₁ = 102
      </text>
      <text x={255} y={baseY + 22} fontSize={12} textAnchor="middle">
        V₂ = ?
      </text>
    </svg>
  );
}
