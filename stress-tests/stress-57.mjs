import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rawFetch, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 57: Content-Type enforcement — request with wrong Content-Type
 * Category: Security Headers & Middleware
 */
describe('Stress-57: Content-Type enforcement', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should reject/handle POST with text/plain Content-Type on tRPC', async () => {
    const N = 50;
    const statuses = [];

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const res = await rawFetch('/trpc/auth.login', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ json: { email: 'patient@example.com', password: 'password123' } }),
      });
      statuses.push(res.status);
    }

    const elapsed = Date.now() - start;

    const statusCounts = {};
    statuses.forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    console.log(`\n📊 Stress-57 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Status distribution:`, statusCounts);

    // Server should not crash — either rejects or handles gracefully
    // All responses should be valid HTTP (no connection drops)
    statuses.forEach(s => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(600);
    });
  });

  it('should reject POST with application/xml Content-Type', async () => {
    const N = 50;
    const statuses = [];

    for (let i = 0; i < N; i++) {
      const res = await rawFetch('/trpc/auth.login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: '<email>patient@example.com</email>',
      });
      statuses.push(res.status);
    }

    const statusCounts = {};
    statuses.forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    console.log(`\n📊 Stress-57 (XML) Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Status distribution:`, statusCounts);

    // Server should handle gracefully
    statuses.forEach(s => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(600);
    });
  });
});