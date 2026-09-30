import type { CanonicalSolutionDto } from '@zybrilka/shared';
import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import { InlineMathText } from '../MathText/MathText.js';
import styles from './CanonicalSolutionView.module.css';

export interface CanonicalSolutionViewProps {
  canonicalSolution: CanonicalSolutionDto;
}

/**
 * Renders a task's Canonical Solution System content — an emphatically
 * additional, separate block from the existing explanation/solutionSteps
 * UI elsewhere on Result, never a replacement for it. Fully data-driven:
 * this component has no idea which task it's rendering, what subject it
 * belongs to, or how many parts/steps a "normal" task has — it only
 * ever maps over `canonicalSolution.parts`/`.steps`/`.criticalPoints`,
 * so the exact same component already works for a future three-part
 * а/б/в task (№19) without any change here.
 *
 * Renders nothing for internal fields a learner has no use for —
 * `category`/`source`/`status` on a critical point, or the template's
 * id/version — those exist for the DTO's own traceability, not for
 * display (see canonicalSolutionDto.ts).
 */
export function CanonicalSolutionView({ canonicalSolution }: CanonicalSolutionViewProps) {
  const { parts, examWriteup, criticalPoints } = canonicalSolution;
  if (parts.length === 0) return null;

  return (
    <div className={styles.section}>
      <h3 className={clsx('text-h3', styles.heading)}>Эталонное решение</h3>
      <div className={styles.parts}>
        {parts.map((part) => (
          <div key={part.id} className={styles.part}>
            <h4 className={styles.partLabel}>{part.label}</h4>
            <div className={styles.steps}>
              {part.steps.map((step, i) => (
                <div key={step.id} className={styles.step}>
                  <span className={styles.stepIndex}>{i + 1}</span>
                  <div className={styles.stepBody}>
                    <p className="text-body-sm" style={{ fontWeight: 700 }}>
                      <InlineMathText text={step.title} />
                    </p>
                    <p className="text-body-sm">
                      <InlineMathText text={step.explanation} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {examWriteup && (
        <div className={styles.writeupBlock}>
          <h3 className={clsx('text-h3', styles.heading)}>
            <Icon name="notes" size={18} className={styles.writeupIcon} />
            Как записать на ЕГЭ
          </h3>
          <p className="text-body-sm">
            <InlineMathText text={examWriteup} />
          </p>
        </div>
      )}

      {criticalPoints.length > 0 && (
        <div className={styles.criticalBlock}>
          <h3 className={clsx('text-h3', styles.heading)}>
            <Icon name="checklist" size={18} className={styles.criticalIcon} />
            Что важно на ЕГЭ
          </h3>
          <ul className={styles.criticalList}>
            {criticalPoints.map((point) => (
              <li key={point.id} className={styles.criticalItem}>
                <InlineMathText text={point.text} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
