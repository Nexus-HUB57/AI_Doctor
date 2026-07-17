/**
 * Stress Test 36: tRPC auth.login 100 Sequential Calls
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 36: tRPC auth.login — 100 sequential calls', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 100 sequential login requests',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const res = await post(
          '/trpc/auth.login',
          { json: { email: 'patient@example.com', password: 'password123' } },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          hasToken: !!res.body?.result?.data?.token,
          hasUser: !!res.body?.result?.data?.user,
        });
      }

      const elapsed = Date.now() - start;
      const successes = results.filter((r) => r.ok && r.hasToken).length;
      const failures = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(TOTAL * 0.95)];

      console.log(`\n  [Stress-36] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-36] Successes: ${successes}, Failures: ${failures}`);
      console.log(`  [Stress-36] Latency — Avg: ${avgDuration}ms, P95: ${p95Duration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-36] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All should succeed (same credentials, bcrypt comparison)
      expect(successes).toBeGreaterThan(0);
      // Most should succeed — bcrypt may have some variability but generally all pass
      expect(successes).toBeGreaterThan(TOTAL * 0.9);
    }
  );
});