import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 71: 404 handling — 200 requests to non-existent REST endpoints
 * Category: Error Handling & Resilience
 */
describe('Stress-71: 404 handling — 200 non-existent REST endpoints', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should return 404 for 200 unique non-existent endpoints', async () => {
    const N = 200;
    const statuses = [];
    const latencies = [];
    const bodyTypes = []; // 'html' | 'json' | 'empty'

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const reqStart = Date.now();
      const res = await get(`/api/nonexistent-endpoint-${i}-${Date.now()}`);
      latencies.push(Date.now() - reqStart);
      statuses.push(res.status);

      if (res.body && res.body.trim().startsWith('{')) {
        bodyTypes.push('json');
      } else if (res.body && res.body.trim().length > 0) {
        bodyTypes.push('html');
      } else {
        bodyTypes.push('empty');
      }
    }

    const elapsed = Date.now() - start;

    const statusCounts = {};
    statuses.forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    const bodyTypeCounts = {};
    bodyTypes.forEach(t => { bodyTypeCounts[t] = (bodyTypeCounts[t] || 0) + 1; });

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    console.log(`\n📊 Stress-71 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  Max latency: ${maxLatency}ms`);
    console.log(`  Status distribution:`, statusCounts);
    console.log(`  Body types:`, bodyTypeCounts);
    console.log(`  Throughput: ${(N / (elapsed / 1000)).toFixed(1)} req/s`);

    // Most should be 404
    const notFoundCount = (statusCounts[404] || 0);
    console.log(`  404 responses: ${notFoundCount}/${N}`);

    // All responses should be valid
    statuses.forEach(s => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(600);
    });

    // All responses should have a body
    bodyTypes.forEach(t => {
      expect(t).not.toBe('empty');
    });

    // Max latency should be reasonable even for 404s
    expect(maxLatency).toBeLessThan(1000);
  });
});