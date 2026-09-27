import type { ReactNode } from 'react';
import { Task1TriangleSVG } from './Task1TriangleSVG.js';
import { Task2VectorsSVG } from './Task2VectorsSVG.js';
import { Task3CylindersSVG } from './Task3CylindersSVG.js';
import { Task11ParabolaSVG } from './Task11ParabolaSVG.js';
import { Task14PyramidSVG } from './Task14PyramidSVG.js';
import { Task17TrapezoidSVG } from './Task17TrapezoidSVG.js';

/** Matches the renderer families a new illustration can be built from — see CoordinatePlaneBase/FunctionGraphSVG/CoordinatePlaneSVG and the *SVG task components for the actual drawing code. Kept mainly for tests/documentation, not for any runtime branching. */
export type IllustrationKind =
  'geometry_2d' | 'geometry_3d' | 'function_graph' | 'coordinate_plane';

interface IllustrationEntry {
  kind: IllustrationKind;
  render: () => ReactNode;
}

/**
 * Custom SVG illustrations for tasks whose diagram can be reproduced
 * exactly (not approximated) from the task's own given data — keyed by
 * (subjectId, taskNumber) rather than by task id, since Variant 1's
 * task ids are regenerated on every re-import but its task numbers are
 * stable. To add a new one: build a `TaskNVsomethingSVG` component (see
 * the existing ones for the house style — #111827 lines, #2563eb/
 * #16a34a accents for a secondary measurement/bisector, 12–14px
 * labels), then add one line here. Every task not listed here falls
 * back to its own `imageUrl` as a plain image (task 8's freeform
 * derivative graph — no algebraic form to plot exactly) or nothing.
 */
const CUSTOM_ILLUSTRATIONS: Record<string, IllustrationEntry> = {
  'math:1': { kind: 'geometry_2d', render: () => <Task1TriangleSVG /> },
  'math:2': { kind: 'coordinate_plane', render: () => <Task2VectorsSVG /> },
  'math:3': { kind: 'geometry_3d', render: () => <Task3CylindersSVG /> },
  'math:11': { kind: 'function_graph', render: () => <Task11ParabolaSVG /> },
  'math:14': { kind: 'geometry_3d', render: () => <Task14PyramidSVG /> },
  'math:17': { kind: 'geometry_2d', render: () => <Task17TrapezoidSVG /> },
};

export function getCustomIllustration(subjectId: string, taskNumber: number): ReactNode | null {
  const entry = CUSTOM_ILLUSTRATIONS[`${subjectId}:${taskNumber}`];
  return entry ? entry.render() : null;
}

export function getIllustrationKind(
  subjectId: string,
  taskNumber: number,
): IllustrationKind | null {
  return CUSTOM_ILLUSTRATIONS[`${subjectId}:${taskNumber}`]?.kind ?? null;
}

/** For tests/reports — every (subjectId, taskNumber) with a custom illustration. */
export function listIllustratedTasks(): readonly string[] {
  return Object.keys(CUSTOM_ILLUSTRATIONS);
}
