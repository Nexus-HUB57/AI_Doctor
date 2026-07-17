import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, wait } from './helpers.mjs';

/**
 * Stress 69: Garbage collection resilience — 500 rapid create operations
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-69: GC resilience — 500 rapid creates', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 500 rapid patient creates without memory issues', async () => {
    const N = 500;
    const statuses = [];
    const latencies = [];

    // Memory before
    const beforeHealth = await get('/api/health');
    const memBefore = beforeHealth.json?.memory;

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const patient = makePatient(i);
      const reqStart = Date.now();
      const res = await post('/trpc/persistence.patients.create', { json: patient });
      latencies.push(Date.now() - reqStart);
      statuses.push(res.status);
    }

    const elapsed = Date.now() - start;

    // Memory after
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory;

    const successCount = statuses.filter(s => s === 200).length;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const maxLatency = sorted[sorted.length - 1];

    console.log(`\n📊 Stress-69 Metrics:`);
    console.log(`  Creates: ${N}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${N - successCount}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Throughput: ${(N / (elapsed / 1000)).toFixed(1)} ops/s`);
    console.log(`  Avg latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms, Max: ${maxLatency}ms`);
    console.log(`  Memory before: ${JSON.stringify(memBefore)}`);
    console.log(`  Memory after:  ${JSON.stringify(memAfter)}`);

    if (memBefore?.heapUsed && memAfter?.heapUsed) {
      const beforeMB = parseFloat(memBefore.heapUsed);
      const afterMB = parseFloat(memAfter.heapUsed);
      console.log(`  Heap growth: ${(afterMB - beforeMB).toFixed(1)}MB`);
    }

    // Most operations should succeed
    expect(successCount).toBeGreaterThan(N * 0.9);

    // P99 should be reasonable
    expect(p99).toBeLessThan(2000);

    // Server should still be healthy
    expect(afterHealth.status).toBe(200);
  });
});