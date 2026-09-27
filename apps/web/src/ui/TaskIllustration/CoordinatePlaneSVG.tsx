import { CoordinatePlaneBase } from './CoordinatePlaneBase.js';

export interface PlaneVector {
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface CoordinatePlaneSVGProps {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  gridStep?: number;
  vectors: readonly PlaneVector[];
  ariaLabel: string;
}

/**
 * Plots vectors from the origin exactly at the coordinates the task
 * gives — for tasks whose "geometry" is really just given coordinates
 * (e.g. vector components), a picture is more useful as a coordinate
 * plane than a function graph.
 */
export function CoordinatePlaneSVG({
  xMin,
  xMax,
  yMin,
  yMax,
  gridStep = 1,
  vectors,
  ariaLabel,
}: CoordinatePlaneSVGProps) {
  return (
    <CoordinatePlaneBase
      xMin={xMin}
      xMax={xMax}
      yMin={yMin}
      yMax={yMax}
      gridStep={gridStep}
      ariaLabel={ariaLabel}
    >
      {({ toSvgX, toSvgY }) => (
        <>
          <defs>
            {vectors.map((v, i) => (
              <marker
                key={i}
                id={`cp-vec-arrow-${i}`}
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={v.color} />
              </marker>
            ))}
          </defs>
          {vectors.map((v, i) => (
            <g key={i}>
              <line
                x1={toSvgX(0)}
                y1={toSvgY(0)}
                x2={toSvgX(v.x)}
                y2={toSvgY(v.y)}
                stroke={v.color}
                strokeWidth={2.5}
                markerEnd={`url(#cp-vec-arrow-${i})`}
              />
              <text
                x={toSvgX(v.x) + (v.x >= 0 ? 8 : -8)}
                y={toSvgY(v.y) + (v.y >= 0 ? -8 : 16)}
                fontSize={13}
                fontStyle="italic"
                fill={v.color}
                textAnchor={v.x >= 0 ? 'start' : 'end'}
              >
                {v.label}
              </text>
            </g>
          ))}
        </>
      )}
    </CoordinatePlaneBase>
  );
}
