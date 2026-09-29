import { getCustomIllustration, illustrationReconstructsOriginal } from './illustrations.js';
import styles from './TaskIllustration.module.css';

export interface TaskExamIllustrationProps {
  subjectId: string;
  taskNumber: number;
  className?: string;
}

/**
 * The task's real given figure — but always as our own verified SVG
 * reconstruction, never the source's raw scan image (EGE Fidelity
 * audit, Block 4: "Мы НЕ хотим вставлять оригинальные изображения ЕГЭ
 * как готовые картинки"). Renders inside "Условие" only when this
 * task's SVG is confirmed to reconstruct a diagram the source material
 * actually prints (tasks 1, 3, 8, 11 — verified against the PDF, see
 * illustrations.tsx); every other task renders nothing here, even if
 * it has a `task.imageUrl` — that raster field is no longer displayed
 * anywhere in the UI at all.
 */
export function TaskExamIllustration({
  subjectId,
  taskNumber,
  className,
}: TaskExamIllustrationProps) {
  if (!illustrationReconstructsOriginal(subjectId, taskNumber)) return null;
  const custom = getCustomIllustration(subjectId, taskNumber);
  if (!custom) return null;
  return <div className={className}>{custom}</div>;
}

export interface TaskSolutionIllustrationProps {
  subjectId: string;
  taskNumber: number;
  className?: string;
}

/**
 * A custom SVG diagram built from the task's own given/derived data,
 * for tasks whose original material prints no diagram at all (2, 14,
 * 17 — text-only Part 2 proofs). Labelled "Иллюстрация к решению" and
 * rendered outside "Условие" — it is our own solving aid, not
 * something the ЕГЭ material actually shows, so it must never be
 * visually mistaken for the original condition (audit Block 5).
 * Renders nothing for a task whose SVG already reconstructs a real
 * original diagram (that one belongs in `TaskExamIllustration` above,
 * not duplicated here) or has no custom illustration at all.
 */
export function TaskSolutionIllustration({
  subjectId,
  taskNumber,
  className,
}: TaskSolutionIllustrationProps) {
  if (illustrationReconstructsOriginal(subjectId, taskNumber)) return null;
  const custom = getCustomIllustration(subjectId, taskNumber);
  if (!custom) return null;
  return (
    <div className={styles.solutionIllustration}>
      <p className={styles.solutionIllustrationLabel}>Иллюстрация к решению</p>
      <div className={className}>{custom}</div>
    </div>
  );
}
