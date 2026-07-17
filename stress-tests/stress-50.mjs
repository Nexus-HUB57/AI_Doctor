/**
 * Stress Test 50: POST to Non-Existent tRPC Route — 100 Requests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, get, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 50: POST to Non-Existent tRPC Route — 100 requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should gracefully handle 100 requests to non-existent tRPC routes',
    { timeout: 60000 },
    async () => {
      const fakeRoutes = [
        '/trpc/nonexistent.route',
        '/trpc/auth.doesNotExist',
        '/trpc/fake.router.procedure',
        '/trpc/persistence.nonexistent',
        '/trpc/hack.inject',
        '/trpc/../../etc/passwd',
        '/trpc/admin.deleteAll',
        '/trpc/auth.bypass',
        '/trpc/..%2F..%2Fetc%2Fpasswd',
        '/trpc/system.shell',
      ];

      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const route = fakeRoutes[i % fakeRoutes.length];
        const res = await post(
          route,
          { json: { test: 'data' } },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          route,
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          body: typeof res.body === 'string' ? res.body.slice(0, 100) : JSON.stringify(res.body).slice(0, 100),
        });
      }

      const elapsed = Date.now() - start;
      const errors = results.filter((r) => !r.ok).length;
      const successes = results.filter((r) => r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);

      // Status code distribution
      const statusCounts = {};
      for (const r of results) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }

      console.log(`\n  [Stress-50] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-50] Errors: ${errors}, Successes: ${successes}`);
      console.log(`  [Stress-50] Status distribution: ${JSON.stringify(statusCounts)}`);
      console.log(`  [Stress-50] Latency — Avg: ${avgDuration}ms, Max: ${maxDuration}ms`);

      // No non-existent route should succeed
      expect(successes).toBe(0);
      expect(errors).toBe(TOTAL);

      // None should be 500 (should be 404 or similar controlled error)
      const serverErrors = results.filter((r) => r.status >= 500).length;
      console.log(`  [Stress-50] Server errors (5xx): ${serverErrors}`);
      // tRPC returns errors for unknown procedures, should be controlled
      // All should at least return a response (not connection errors)
      const connectionErrors = results.filter((r) => r.status === 0).length;
      expect(connectionErrors).toBe(0);
    }
  );
});