import { defineProject } from 'vitest/config';

// Resolve workspace packages to their TypeScript source, so tests never depend on a prior build.
const conditions = ['@zybrilka/source', 'module', 'node', 'development|production'];

export default defineProject({
  ssr: { resolve: { conditions } },
  test: { name: 'worker' },
});
