import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, wait } from './helpers.mjs';

/**
 * Stress 67: Long-running connection simulation — 100 sequential 1s-delayed requests
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-67: Long-running connection simulation — 100 delayed requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 100 sequential requests with 1s delays', async () => {
    const N = 100;
    const statuses = [];
    const latencies = [];

    // Memory before
    const beforeHealth = await get('/api/health');
    const memBefore = beforeHealth.json?.memory?.heapUsed;

    const overallStart = Date.now();

    for (let i = 0; i < N; i++) {
      await wait(1000); // 1s delay between requests

      const reqStart = Date.now();
      const res = await get('/api/health');
      latencies.push(Date.now() - reqStart);
      statuses.push(res.status);
    }

    const overallElapsed = Date.now() - overallStart;

    // Memory after
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory?.heapUsed;

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    console.log(`\n📊 Stress-67 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Overall time: ${overallElapsed}ms (~${(overallElapsed / 1000).toFixed(1)}s)`);
    console.log(`  Min latency: ${minLatency}ms`);
    console.log(`  Max latency: ${maxLatency}ms`);
    console.log(`  Avg latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  All 200 OK: ${statuses.every(s => s === 200)}`);
    console.log(`  Memory before: ${memBefore}`);
    console.log(`  Memory after: ${memAfter}`);

    if (memBefore && memAfter) {
      const growth = parseFloat(memAfter) - parseFloat(memBefore);
      console.log(`  Memory growth: ${growth.toFixed(1)}MB`);
    }

    // All should succeed
    expect(statuses.every(s => s === 200)).toBe(true);

    // Overall time should be roughly 100s
    expect(overallElapsed).toBeGreaterThan(95000);

    // Individual request latency should not degrade
    // Compare first 20 vs last 20
    const first20Avg = latencies.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
    const last20Avg = latencies.slice(-20).reduce((a, b) => a + b, 0) / 20;
    console.log(`  First 20 avg latency: ${first20Avg.toFixed(1)}ms`);
    console.log(`  Last 20 avg latency: ${last20Avg.toFixed(1)}ms`);

    // Last 20 should not be more than 10x slower than first 20
    if (first20Avg > 0) {
      expect(last20Avg).toBeLessThan(first20Avg * 10);
    }
  });
});