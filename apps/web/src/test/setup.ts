import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Testing Library's auto-cleanup relies on a global `afterEach` hook, which
// Vitest only provides when `test.globals` is enabled. This project keeps
// explicit imports (no globals), so cleanup is wired up here instead —
// otherwise each test's render() output would stack up in the DOM.
afterEach(() => {
  cleanup();
});
