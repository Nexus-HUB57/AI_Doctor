import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 61: Sustained 500 health checks — measure memory before and after
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-61: Sustained 500 health checks — memory measurement', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 500 health checks without significant memory growth', async () => {
    const N = 500;

    // Capture memory before
    const beforeRes = await get('/api/health');
    const memBefore = beforeRes.json?.memory?.heapUsed;
    console.log(`\n📊 Stress-61: Memory before: ${memBefore}`);

    const statuses = [];
    const latencies = [];
    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const reqStart = Date.now();
      const res = await get('/api/health');
      latencies.push(Date.now() - reqStart);
      statuses.push(res.status);
    }

    const elapsed = Date.now() - start;

    // Capture memory after
    const afterRes = await get('/api/health');
    const memAfter = afterRes.json?.memory?.heapUsed;

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)];
    const p99 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];

    console.log(`\n📊 Stress-61 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Throughput: ${(N / (elapsed / 1000)).toFixed(1)} req/s`);
    console.log(`  Avg latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  P50 latency: ${p50}ms`);
    console.log(`  P99 latency: ${p99}ms`);
    console.log(`  Memory before: ${memBefore}`);
    console.log(`  Memory after: ${memAfter}`);
    console.log(`  All 200 OK: ${statuses.every(s => s === 200)}`);

    // All requests should succeed
    expect(statuses.every(s => s === 200)).toBe(true);

    // Memory should not grow by more than 50MB
    if (memBefore && memAfter) {
      const beforeMB = parseFloat(memBefore);
      const afterMB = parseFloat(memAfter);
      const growth = afterMB - beforeMB;
      console.log(`  Memory growth: ${growth.toFixed(1)}MB`);
      expect(growth).toBeLessThan(50);
    }

    // P99 should be under 1s
    expect(p99).toBeLessThan(1000);
  });
});