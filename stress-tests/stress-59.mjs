import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, rawFetch, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 59: Large header injection — 100 requests with oversized custom headers
 * Category: Security Headers & Middleware
 */
describe('Stress-59: Large header injection', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 100 requests with oversized custom headers', async () => {
    const N = 100;
    const statuses = [];
    const errors = [];

    // Generate a large header value (~8KB per header)
    const largeValue = 'X'.repeat(8192);

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      try {
        const res = await get('/api/health', {
          'X-Custom-Large-Header': largeValue + i,
          'X-Another-Injected': 'A'.repeat(4096),
          'X-Padding-Header': 'B'.repeat(2048),
        });
        statuses.push(res.status);
      } catch (err) {
        errors.push(err.message);
        statuses.push(0);
      }
    }

    const elapsed = Date.now() - start;

    const statusCounts = {};
    statuses.filter(s => s > 0).forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    console.log(`\n📊 Stress-59 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg per request: ${(elapsed / N).toFixed(1)}ms`);
    console.log(`  Successful responses: ${statuses.filter(s => s > 0).length}`);
    console.log(`  Connection errors: ${errors.length}`);
    console.log(`  Status distribution:`, statusCounts);

    // Server must not crash — most requests should get a response
    const successRate = statuses.filter(s => s > 0 && s < 500).length / N;
    console.log(`  Success rate: ${(successRate * 100).toFixed(1)}%`);

    expect(successRate).toBeGreaterThan(0.9);

    // No connection errors (server didn't crash)
    expect(errors.length).toBeLessThan(5);
  });
});