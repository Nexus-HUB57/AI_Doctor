import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rawFetch, get, startServer, stopServer, wait } from './helpers.mjs';

/**
 * Stress 75: Concurrent error storm — 100 concurrent requests that all fail
 * Category: Error Handling & Resilience
 */
describe('Stress-75: Concurrent error storm — 100 failing requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  async function failingRequest(id) {
    const method = id % 3;
    try {
      if (method === 0) {
        const res = await get(`/api/storm-404-${id}`);
        return { id, status: res.status, error: null };
      } else if (method === 1) {
        const res = await rawFetch('/trpc/auth.login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{malformed!!!',
        });
        return { id, status: res.status, error: null };
      } else {
        const res = await rawFetch('/trpc/auth.login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: { email: 'nope', password: 'x' } }),
        });
        return { id, status: res.status, error: null };
      }
    } catch (err) {
      return { id, status: 0, error: err.message };
    }
  }

  it('should handle 100 concurrent failing requests without crashing', async () => {
    const N = 100;

    // Health before
    const beforeHealth = await get('/api/health');
    expect(beforeHealth.status).toBe(200);

    const start = Date.now();

    // Fire all 100 concurrently
    const promises = [];
    for (let i = 0; i < N; i++) {
      promises.push(failingRequest(i));
    }

    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;

    // Health after storm
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory;

    const statuses = results.map(r => r.status);
    const errors = results.filter(r => r.error);
    const errorResponses = statuses.filter(s => s >= 400);
    const connectionErrors = results.filter(r => r.status === 0);

    const statusCounts = {};
    statuses.filter(s => s > 0).forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    console.log(`\n📊 Stress-75 Metrics:`);
    console.log(`  Concurrent failing requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Error responses (4xx/5xx): ${errorResponses.length}/${N}`);
    console.log(`  Connection errors: ${connectionErrors.length}`);
    console.log(`  Status distribution:`, statusCounts);
    console.log(`  Post-storm health: ${afterHealth.status}`);
    console.log(`  Post-storm memory: ${JSON.stringify(memAfter)}`);

    // All requests should get a response (no dropped connections)
    expect(connectionErrors.length).toBeLessThan(10);

    // Most should be error responses
    expect(errorResponses.length).toBeGreaterThan(N * 0.8);

    // Server must survive the storm
    expect(afterHealth.status).toBe(200);

    // All statuses should be valid HTTP
    statuses.filter(s => s > 0).forEach(s => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(600);
    });
  });

  it('should remain responsive after concurrent error storm', async () => {
    // Run 50 sequential health checks after the storm
    const N = 50;
    const statuses = [];

    for (let i = 0; i < N; i++) {
      const res = await get('/api/health');
      statuses.push(res.status);
    }

    const allOk = statuses.every(s => s === 200);

    console.log(`\n📊 Stress-75 (Post-storm recovery) Metrics:`);
    console.log(`  Post-storm health checks: ${N}`);
    console.log(`  All 200 OK: ${allOk}`);

    expect(allOk).toBe(true);
  });
});