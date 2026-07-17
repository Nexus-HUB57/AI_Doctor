/**
 * Stress Test 39: tRPC persistence.patients.create 100 Sequential
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, makePatient, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 39: tRPC persistence.patients.create — 100 sequential', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should create 100 patients sequentially without errors',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const results = [];
      const createdIds = [];

      for (let i = 0; i < TOTAL; i++) {
        const patient = makePatient(i);
        const res = await post(
          '/trpc/persistence.patients.create',
          { json: patient },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          id: res.body?.result?.data?.id,
        });
        if (res.body?.result?.data?.id) {
          createdIds.push(res.body.result.data.id);
        }
      }

      const elapsed = Date.now() - start;
      const successes = results.filter((r) => r.ok).length;
      const failures = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(TOTAL * 0.95)];

      console.log(`\n  [Stress-39] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-39] Created: ${successes}, Failed: ${failures}`);
      console.log(`  [Stress-39] Unique IDs: ${new Set(createdIds).size}`);
      console.log(`  [Stress-39] Latency — Avg: ${avgDuration}ms, P95: ${p95Duration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-39] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All should succeed
      expect(successes).toBe(TOTAL);
      // Each should have a unique ID
      expect(new Set(createdIds).size).toBe(TOTAL);
      // Verify data shape of last created patient
      const lastResult = results[results.length - 1];
      expect(lastResult.id).toBeDefined();
      expect(typeof lastResult.id).toBe('string');
    }
  );
});