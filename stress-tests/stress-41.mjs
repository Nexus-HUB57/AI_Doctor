/**
 * Stress Test 41: tRPC persistence.analytics.getSystemStats 100 Sequential
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 41: tRPC persistence.analytics.getSystemStats — 100 sequential', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 100 sequential system stats queries',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const res = await get('/trpc/persistence.analytics.getSystemStats', { 'X-Request-ID': reqId() });
        const data = res.body?.result?.data;
        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          totalPatients: data?.totalPatients,
          totalDiagnoses: data?.totalDiagnoses,
        });
      }

      const elapsed = Date.now() - start;
      const successes = results.filter((r) => r.ok).length;
      const failures = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(TOTAL * 0.95)];

      console.log(`\n  [Stress-41] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-41] Successes: ${successes}, Failures: ${failures}`);
      console.log(`  [Stress-41] Latency — Avg: ${avgDuration}ms, P95: ${p95Duration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-41] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // Verify last response shape
      const lastData = results[results.length - 1];
      console.log(`  [Stress-41] Last response — totalPatients: ${lastData.totalPatients}, totalDiagnoses: ${lastData.totalDiagnoses}`);

      // All should succeed
      expect(successes).toBe(TOTAL);
      // Response should have expected fields
      expect(typeof lastData.totalPatients).toBe('number');
      expect(typeof lastData.totalDiagnoses).toBe('number');
    }
  );
});