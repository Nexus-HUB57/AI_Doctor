/**
 * Stress Test 43: tRPC auth.rolesInfo 500 Concurrent (lightweight query)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

const TOTAL = 500;

describe('Stress Test 43: tRPC auth.rolesInfo — 500 concurrent', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 500 concurrent rolesInfo queries',
    { timeout: 60000 },
    async () => {
      const start = Date.now();

      const promises = Array.from({ length: TOTAL }, () =>
        get('/trpc/auth.rolesInfo', { 'X-Request-ID': reqId() })
      );

      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;

      const successes = results.filter((r) => r.ok).length;
      const failures = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const p99Duration = durations.sort((a, b) => a - b)[Math.floor(TOTAL * 0.99)];

      console.log(`\n  [Stress-43] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-43] Successes: ${successes}, Failures: ${failures}`);
      console.log(`  [Stress-43] Latency — Avg: ${avgDuration}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms, P99: ${p99Duration}ms`);
      console.log(`  [Stress-43] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All should succeed — it's a simple in-memory query
      expect(successes).toBe(TOTAL);
      expect(failures).toBe(0);

      // Verify response shape
      const first = results[0];
      expect(first.body?.result?.data).toHaveProperty('roles');
    }
  );
});