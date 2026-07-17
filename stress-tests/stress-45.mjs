/**
 * Stress Test 45: tRPC persistence.diagnoses.create Bulk 50 Sequential
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 50;

describe('Stress Test 45: tRPC persistence.diagnoses.create — 50 sequential', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should create 50 diagnoses sequentially',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const results = [];
      const createdIds = [];

      const tumorTypes = ['Carcinoma', 'Sarcoma', 'Lymphoma', 'Melanoma', 'Leukemia'];
      const stages = ['I', 'II', 'III', 'IV'];

      for (let i = 0; i < TOTAL; i++) {
        const res = await post(
          '/trpc/persistence.diagnoses.create',
          {
            json: {
              patientId: `stress_patient_${i}`,
              patientName: `Patient ${i}`,
              age: 30 + (i % 50),
              diagnosis: `Test diagnosis ${i} — ${tumorTypes[i % tumorTypes.length]}`,
              tumorType: tumorTypes[i % tumorTypes.length],
              stage: stages[i % stages.length],
              notes: `Stress test diagnosis entry #${i}`,
            },
          },
          { 'X-Request-ID': reqId() }
        );

        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          id: res.body?.result?.data?.id,
          diagnosis: res.body?.result?.data?.diagnosis,
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

      console.log(`\n  [Stress-45] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-45] Created: ${successes}, Failed: ${failures}`);
      console.log(`  [Stress-45] Unique IDs: ${new Set(createdIds).size}`);
      console.log(`  [Stress-45] Latency — Avg: ${avgDuration}ms, P95: ${p95Duration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-45] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All should succeed
      expect(successes).toBe(TOTAL);
      expect(failures).toBe(0);
      // Each should have a unique ID
      expect(new Set(createdIds).size).toBe(TOTAL);

      // Verify last response shape
      const last = results[results.length - 1];
      expect(last.id).toBeDefined();
      expect(last.diagnosis).toContain('Test diagnosis');
    }
  );
});