import { defineConfig } from 'vite';

/**
 * Vitest config for stress tests.
 * Uses 'node' environment (no jsdom) and includes stress-tests/ directory.
 *
 * Usage:
 *   npx vitest run --config vite.stress.config.ts stress-tests/stress-01.mjs
 *   npx vitest run --config vite.stress.config.ts stress-tests/stress-26.mjs
 */
export default defineConfig({
  root: import.meta.dirname,
  test: {
    environment: 'node',
    globals: true,
    include: ['stress-tests/**/*.mjs'],
    // No setupFiles — stress tests manage their own server lifecycle
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
});