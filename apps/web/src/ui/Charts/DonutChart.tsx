import type { ReactNode } from 'react';
import styles from './DonutChart.module.css';

export interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
}

export interface DonutChartProps {
  segments: readonly DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: ReactNode;
  ariaLabel: string;
  className?: string;
}

/**
 * Multi-segment SVG donut (Statistics/Mistakes — "Распределение по
 * темам" / "Статистика ошибок"). Each segment is a real `<circle>`
 * stroke-dasharray slice with its own color and legend row, computed
 * from the passed percentages — not a static image.
 */
export function DonutChart({
  segments,
  size = 180,
  strokeWidth = 22,
  centerLabel,
  ariaLabel,
  className,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs: { seg: DonutSegment; dasharray: string; dashoffset: number }[] = [];
  let offsetSoFar = 0;
  for (const seg of segments) {
    const segLength = (seg.percent / 100) * circumference;
    arcs.push({
      seg,
      dasharray: `${segLength} ${circumference - segLength}`,
      dashoffset: -offsetSoFar,
    });
    offsetSoFar += segLength;
  }

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <div className={styles.ringBox} style={{ width: size, height: size }}>
        <svg className={styles.svg} width={size} height={size} role="img" aria-label={ariaLabel}>
          {arcs.map(({ seg, dasharray, dashoffset }) => (
            <circle
              key={seg.label}
              className={styles.segment}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
            >
              <title>
                {seg.label}: {seg.percent}%
              </title>
            </circle>
          ))}
        </svg>
        {centerLabel && <div className={styles.center}>{centerLabel}</div>}
      </div>
      <div className={styles.legend}>
        {segments.map((seg) => (
          <div key={seg.label} className={styles.legendRow}>
            <span className={styles.dot} style={{ background: seg.color }} />
            <span className={styles.legendLabel}>{seg.label}</span>
            <span className={styles.legendValue}>{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
