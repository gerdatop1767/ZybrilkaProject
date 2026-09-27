import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Whether `moduleUrl` (pass `import.meta.url`) is the script Node was
 * invoked with directly — the ESM replacement for `require.main ===
 * module`, used to gate a `main()` call so importing the module for its
 * exports (tests, other scripts) never runs it as a side effect.
 *
 * A plain `process.argv[1] === fileURLToPath(import.meta.url)` breaks
 * under pnpm: `node node_modules/@zybrilka/db/dist/migrate.js` resolves
 * `import.meta.url` through the real path inside pnpm's `.pnpm` store
 * (Node's ESM loader follows the `node_modules/@zybrilka/db` symlink),
 * while `process.argv[1]` stays the symlinked path as typed on the
 * command line — the two never match, so `main()` silently never runs
 * and the process exits 0 having done nothing. Resolving both sides
 * through `realpathSync` compares the same underlying file either way.
 */
export function isMainModule(moduleUrl: string): boolean {
  const entryPoint = process.argv[1];
  if (!entryPoint) {
    return false;
  }
  try {
    return realpathSync(entryPoint) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
