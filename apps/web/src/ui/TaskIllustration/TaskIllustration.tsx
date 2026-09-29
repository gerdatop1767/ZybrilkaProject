import { getCustomIllustration } from './illustrations.js';
import styles from './TaskIllustration.module.css';

export interface TaskConditionImageProps {
  /** The task's own imageUrl — a PDF-cropped scan, i.e. the actual
   * figure given in the source ЕГЭ material. Never a reconstruction:
   * this is the only illustration that may render inside "Условие"
   * (audit Block 5). */
  imageUrl: string | null;
  className?: string;
}

/**
 * The task's real given image, if the source material has one (e.g.
 * task 8's derivative graph). Renders inside "Условие" — this is
 * exactly what the ЕГЭ material shows, so it's fine to present as part
 * of the condition. Renders nothing when there's no real image; a
 * custom SVG reconstruction is never shown here — see
 * `TaskSolutionIllustration` below.
 */
export function TaskConditionImage({ imageUrl, className }: TaskConditionImageProps) {
  if (!imageUrl) return null;
  const combinedClassName = className ? `${className} ${styles.pdfFallback}` : styles.pdfFallback;
  return <img src={imageUrl} alt="Иллюстрация к заданию" className={combinedClassName} />;
}

export interface TaskSolutionIllustrationProps {
  subjectId: string;
  taskNumber: number;
  /** When the task has a real given image, the custom SVG is
   * redundant (and, worse, could be a diagram for a *different*
   * variant's numbers) — the real image already rendered in
   * TaskConditionImage above takes priority and this renders nothing
   * (audit Block 6). */
  imageUrl: string | null;
  className?: string;
}

/**
 * A custom SVG diagram reconstructed from the task's own given data,
 * for tasks whose original material has no image of its own. Labelled
 * "Иллюстрация к решению" and rendered outside "Условие" — it is our
 * reconstruction, not something the ЕГЭ material actually shows, so it
 * must never be visually mistaken for the original condition (audit
 * Block 5). Renders nothing once a real `imageUrl` exists (Block 6) or
 * no custom illustration exists for this task at all.
 */
export function TaskSolutionIllustration({
  subjectId,
  taskNumber,
  imageUrl,
  className,
}: TaskSolutionIllustrationProps) {
  if (imageUrl) return null;
  const custom = getCustomIllustration(subjectId, taskNumber);
  if (!custom) return null;
  return (
    <div className={styles.solutionIllustration}>
      <p className={styles.solutionIllustrationLabel}>Иллюстрация к решению</p>
      <div className={className}>{custom}</div>
    </div>
  );
}
