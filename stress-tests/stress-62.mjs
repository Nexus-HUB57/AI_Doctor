import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, wait } from './helpers.mjs';

/**
 * Stress 62: Sustained 200 auth logins — CPU/memory over time
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-62: Sustained 200 auth logins — CPU/memory tracking', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 200 sequential logins with stable memory', async () => {
    const N = 200;
    const statuses = [];
    const latencies = [];
    const memorySnapshots = [];

    // Snapshot every 50 requests
    const SNAPSHOT_INTERVAL = 50;

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const reqStart = Date.now();
      const res = await post('/trpc/auth.login', {
        json: { email: 'patient@example.com', password: 'password123' },
      });
      latencies.push(Date.now() - reqStart);
      statuses.push(res.status);

      if ((i + 1) % SNAPSHOT_INTERVAL === 0) {
        const healthRes = await get('/api/health');
        const memMB = healthRes.json?.memory?.heapUsed;
        memorySnapshots.push({ request: i + 1, heapUsed: memMB });
      }
    }

    const elapsed = Date.now() - start;

    const successCount = statuses.filter(s => s === 200).length;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const p99 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)];

    console.log(`\n📊 Stress-62 Metrics:`);
    console.log(`  Logins: ${N}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${N - successCount}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  Max latency: ${maxLatency}ms`);
    console.log(`  P99 latency: ${p99}ms`);
    console.log(`  Throughput: ${(N / (elapsed / 1000)).toFixed(1)} logins/s`);
    console.log(`  Memory snapshots:`);
    for (const snap of memorySnapshots) {
      console.log(`    After request ${snap.request}: ${snap.heapUsed}`);
    }

    // Most logins should succeed
    expect(successCount).toBeGreaterThan(N * 0.95);

    // Memory should not balloon
    if (memorySnapshots.length >= 2) {
      const first = parseFloat(memorySnapshots[0].heapUsed);
      const last = parseFloat(memorySnapshots[memorySnapshots.length - 1].heapUsed);
      if (first > 0 && last > 0) {
        const growth = last - first;
        console.log(`  Total memory growth: ${growth.toFixed(1)}MB`);
        expect(growth).toBeLessThan(50);
      }
    }

    // P99 latency should be reasonable
    expect(p99).toBeLessThan(2000);
  });
});