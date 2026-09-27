import { defineProject } from 'vitest/config';

// Resolve workspace packages (e.g. @zybrilka/shared) to their TypeScript
// source, so tests never depend on a prior build having run.
const conditions = ['@zybrilka/source', 'module', 'node', 'development|production'];

export default defineProject({
  ssr: { resolve: { conditions } },
  test: { name: 'db' },
});
