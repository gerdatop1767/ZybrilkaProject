import { getCustomIllustration } from './illustrations.js';

export interface TaskIllustrationProps {
  subjectId: string;
  taskNumber: number;
  /** The task's own imageUrl (a PDF-derived asset) — used only when no custom SVG exists for this task. */
  imageUrl: string | null;
  className?: string;
}

/**
 * Renders a task's illustration: a custom SVG diagram when one exists
 * for this (subjectId, taskNumber) — reproduced accurately from the
 * source material rather than a static image — otherwise falls back
 * to the task's own `imageUrl` (a cropped image from the source PDF),
 * otherwise nothing. Used by both Task and Result screens so the two
 * never disagree on which illustration a task shows.
 */
export function TaskIllustration({
  subjectId,
  taskNumber,
  imageUrl,
  className,
}: TaskIllustrationProps) {
  const custom = getCustomIllustration(subjectId, taskNumber);
  if (custom) {
    return <div className={className}>{custom}</div>;
  }
  if (imageUrl) {
    return <img src={imageUrl} alt="Иллюстрация к заданию" className={className} />;
  }
  return null;
}
