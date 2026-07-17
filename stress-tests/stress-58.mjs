import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rawFetch, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 58: Missing Content-Type on POST — 50 requests without Content-Type
 * Category: Security Headers & Middleware
 */
describe('Stress-58: Missing Content-Type on POST requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 50 POST requests without Content-Type header', async () => {
    const N = 50;
    const statuses = [];
    const bodies = [];

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const res = await rawFetch('/trpc/auth.login', {
        method: 'POST',
        headers: { /* no Content-Type */ },
        body: JSON.stringify({ json: { email: 'patient@example.com', password: 'password123' } }),
      });
      statuses.push(res.status);
      bodies.push(res.body?.length || 0);
    }

    const elapsed = Date.now() - start;

    const statusCounts = {};
    statuses.forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    console.log(`\n📊 Stress-58 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg per request: ${(elapsed / N).toFixed(1)}ms`);
    console.log(`  Status distribution:`, statusCounts);

    // Server must not crash
    statuses.forEach(s => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(600);
    });

    // All responses should have bodies
    bodies.forEach(b => {
      expect(b).toBeGreaterThan(0);
    });
  });
});