/**
 * Public surface of the content layer — templates and authored
 * canonical-solution content for specific tasks. Exported from
 * `@zybrilka/shared` as its own namespace (`solutionTemplates`),
 * separate from `solutionEngine` (the subject-agnostic mechanism) —
 * this namespace is where subject/task-specific content actually
 * lives, one file per subject/taskNumber (see math/13/*).
 */
export * from './math/13/equation.v1.js';
export * from './math/13/realTask13Variant1.js';
export * from './math/14/stereometry.v1.js';
export * from './math/14/realTask14Variant1.js';
export * from './math/15/inequality.v1.js';
export * from './math/15/realTask15Variant1.js';
