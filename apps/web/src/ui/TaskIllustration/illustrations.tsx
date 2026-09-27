import type { ReactNode } from 'react';
import { Task1TriangleSVG } from './Task1TriangleSVG.js';
import { Task11ParabolaSVG } from './Task11ParabolaSVG.js';

/**
 * Custom SVG illustrations for tasks whose printed diagram can be
 * reproduced exactly (not approximated) from the task's own given
 * data — keyed by (subjectId, taskNumber) rather than by task id,
 * since Variant 1's task ids are regenerated on every re-import but
 * its task numbers are stable. Every other task (including ones with
 * a real `imageUrl` we can't safely redraw, like task 8's freeform
 * derivative graph) falls back to rendering `imageUrl` as a plain
 * image — see Task/Result screens.
 */
const CUSTOM_ILLUSTRATIONS: Record<string, () => ReactNode> = {
  'math:1': () => <Task1TriangleSVG />,
  'math:11': () => <Task11ParabolaSVG />,
};

export function getCustomIllustration(subjectId: string, taskNumber: number): ReactNode | null {
  const render = CUSTOM_ILLUSTRATIONS[`${subjectId}:${taskNumber}`];
  return render ? render() : null;
}
