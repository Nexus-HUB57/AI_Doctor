/**
 * Stress Test 40: tRPC persistence.patients.list 200 Sequential
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

const TOTAL = 200;

describe('Stress Test 40: tRPC persistence.patients.list — 200 sequential', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 200 sequential patient list queries',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const res = await get('/trpc/persistence.patients.list', { 'X-Request-ID': reqId() });
        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          patientCount: Array.isArray(res.body?.result?.data)
            ? res.body.result.data.length
            : -1,
        });
      }

      const elapsed = Date.now() - start;
      const successes = results.filter((r) => r.ok).length;
      const failures = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const p99Duration = durations.sort((a, b) => a - b)[Math.floor(TOTAL * 0.99)];

      // Patient count should be consistent (same data)
      const patientCounts = results.filter((r) => r.patientCount >= 0).map((r) => r.patientCount);
      const consistentCount = new Set(patientCounts).size === 1;

      console.log(`\n  [Stress-40] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-40] Successes: ${successes}, Failures: ${failures}`);
      console.log(`  [Stress-40] Patients per response: ${patientCounts[0] ?? 'N/A'}, Consistent: ${consistentCount}`);
      console.log(`  [Stress-40] Latency — Avg: ${avgDuration}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms, P99: ${p99Duration}ms`);
      console.log(`  [Stress-40] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All should succeed
      expect(successes).toBe(TOTAL);
      expect(failures).toBe(0);
      // Response should be an array
      expect(patientCounts[0]).toBeGreaterThanOrEqual(0);
    }
  );
});