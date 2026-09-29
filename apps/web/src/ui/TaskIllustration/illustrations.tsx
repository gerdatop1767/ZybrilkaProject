import type { ReactNode } from 'react';
import { Task1TriangleSVG } from './Task1TriangleSVG.js';
import { Task2VectorsSVG } from './Task2VectorsSVG.js';
import { Task3CylindersSVG } from './Task3CylindersSVG.js';
import { Task8DerivativeGraphSVG } from './Task8DerivativeGraphSVG.js';
import { Task11ParabolaSVG } from './Task11ParabolaSVG.js';
import { Task14PyramidSVG } from './Task14PyramidSVG.js';
import { Task17TrapezoidSVG } from './Task17TrapezoidSVG.js';

/** Matches the renderer families a new illustration can be built from — see CoordinatePlaneBase/FunctionGraphSVG/CoordinatePlaneSVG and the *SVG task components for the actual drawing code. Kept mainly for tests/documentation, not for any runtime branching. */
export type IllustrationKind =
  'geometry_2d' | 'geometry_3d' | 'function_graph' | 'coordinate_plane';

interface IllustrationEntry {
  kind: IllustrationKind;
  /** True when the source ЕГЭ material actually prints a diagram here
   * (verified against the PDF — EGE Fidelity audit Block 4/6) and this
   * SVG is a faithful vector reconstruction of THAT diagram, element by
   * element — so it belongs inside "Условие", replacing the raw scan
   * image entirely (never shown as a raster picture — audit Block 4).
   * False means the original prints no diagram at all for this task
   * (a Part 2 proof left for the student to sketch); the SVG then is
   * our own solving aid, built only from facts the problem states or
   * the solution derives, and renders outside "Условие" labelled
   * "Иллюстрация к решению" so it's never mistaken for the original. */
  reconstructsOriginal: boolean;
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
 * labels), then add one line here.
 *
 * Per-task PDF check (EGE Fidelity audit, ЕГЭ 2026 Ященко Вариант 1,
 * pages 1-4): the source prints a real diagram only for tasks 1, 3, 8
 * and 11 — 2, 14 and 17 are text-only proofs with no picture at all.
 */
const CUSTOM_ILLUSTRATIONS: Record<string, IllustrationEntry> = {
  'math:1': { kind: 'geometry_2d', reconstructsOriginal: true, render: () => <Task1TriangleSVG /> },
  'math:2': {
    kind: 'coordinate_plane',
    reconstructsOriginal: false,
    render: () => <Task2VectorsSVG />,
  },
  'math:3': {
    kind: 'geometry_3d',
    reconstructsOriginal: true,
    render: () => <Task3CylindersSVG />,
  },
  'math:8': {
    kind: 'function_graph',
    reconstructsOriginal: true,
    render: () => <Task8DerivativeGraphSVG />,
  },
  'math:11': {
    kind: 'function_graph',
    reconstructsOriginal: true,
    render: () => <Task11ParabolaSVG />,
  },
  'math:14': {
    kind: 'geometry_3d',
    reconstructsOriginal: false,
    render: () => <Task14PyramidSVG />,
  },
  'math:17': {
    kind: 'geometry_2d',
    reconstructsOriginal: false,
    render: () => <Task17TrapezoidSVG />,
  },
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

/** True when this task's SVG reconstructs a diagram the source
 * material really prints (see `IllustrationEntry.reconstructsOriginal`
 * above) — false both when there's no custom illustration at all and
 * when it's a solving aid for a no-diagram problem. */
export function illustrationReconstructsOriginal(subjectId: string, taskNumber: number): boolean {
  return CUSTOM_ILLUSTRATIONS[`${subjectId}:${taskNumber}`]?.reconstructsOriginal ?? false;
}

/** For tests/reports — every (subjectId, taskNumber) with a custom illustration. */
export function listIllustratedTasks(): readonly string[] {
  return Object.keys(CUSTOM_ILLUSTRATIONS);
}
