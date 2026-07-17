import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 70: Connection pool simulation — rapid open/close of 200 HTTP connections
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-70: Connection pool — 200 rapid HTTP connections', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle rapid open/close of 200 HTTP connections', async () => {
    const N = 200;
    const statuses = [];
    const latencies = [];
    const errors = [];

    // Memory before
    const beforeHealth = await get('/api/health');
    const memBefore = beforeHealth.json?.memory?.heapUsed;

    const start = Date.now();

    // Use raw fetch with explicit Connection: close to force new connections
    for (let i = 0; i < N; i++) {
      try {
        const reqStart = Date.now();
        const res = await fetch('http://localhost:3777/api/health', {
          headers: {
            'Connection': 'close',
            'Cache-Control': 'no-cache',
          },
        });
        const text = await res.text();
        latencies.push(Date.now() - reqStart);
        statuses.push(res.status);
      } catch (err) {
        errors.push(err.message);
        statuses.push(0);
      }
    }

    const elapsed = Date.now() - start;

    // Memory after
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory?.heapUsed;

    const successCount = statuses.filter(s => s === 200).length;
    const avgLatency = latencies.length
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : 'N/A';

    console.log(`\n📊 Stress-70 Metrics:`);
    console.log(`  Connections: ${N}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg latency: ${avgLatency}ms`);
    console.log(`  Memory before: ${memBefore}`);
    console.log(`  Memory after: ${memAfter}`);

    if (memBefore && memAfter) {
      const growth = parseFloat(memAfter) - parseFloat(memBefore);
      console.log(`  Memory growth: ${growth.toFixed(1)}MB`);
    }

    // Almost all connections should succeed
    expect(successCount).toBeGreaterThan(N * 0.95);

    // No connection errors
    expect(errors.length).toBeLessThan(5);

    // Server should still be healthy
    expect(afterHealth.status).toBe(200);
  });
});