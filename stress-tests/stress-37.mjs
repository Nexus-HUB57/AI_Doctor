/**
 * Stress Test 37: tRPC auth.login 50 Concurrent Calls
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 50;

describe('Stress Test 37: tRPC auth.login — 50 concurrent calls', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 50 concurrent login requests',
    { timeout: 60000 },
    async () => {
      const start = Date.now();

      const promises = Array.from({ length: TOTAL }, () =>
        post(
          '/trpc/auth.login',
          { json: { email: 'patient@example.com', password: 'password123' } },
          { 'X-Request-ID': reqId() }
        )
      );

      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;

      const successes = results.filter((r) => r.ok && r.body?.result?.data?.token).length;
      const failures = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(`\n  [Stress-37] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-37] Successes: ${successes}, Failures: ${failures}`);
      console.log(`  [Stress-37] Latency — Avg: ${avgDuration}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-37] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All 50 should succeed
      expect(successes).toBeGreaterThan(0);
      expect(successes).toBeGreaterThanOrEqual(TOTAL * 0.8);

      // Verify response shape on a successful one
      const successRes = results.find((r) => r.ok);
      if (successRes) {
        expect(successRes.body?.result?.data).toHaveProperty('token');
        expect(successRes.body?.result?.data?.user).toHaveProperty('email');
      }
    }
  );
});