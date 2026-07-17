/**
 * Stress Test 34: Rate Limit Concurrent Burst
 * 200 concurrent requests to /api/health
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

const TOTAL = 200;

describe('Stress Test 34: Rate Limit Concurrent Burst — 200 concurrent /api/health', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 200 concurrent requests, rate-limiting excess',
    { timeout: 60000 },
    async () => {
      const start = Date.now();

      // Fire all 200 requests concurrently
      const promises = Array.from({ length: TOTAL }, () =>
        get('/api/health', { 'X-Request-ID': reqId() })
      );

      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;

      const ok200 = results.filter((r) => r.status === 200).length;
      const rateLimited429 = results.filter((r) => r.status === 429).length;
      const otherErrors = results.filter((r) => r.status !== 200 && r.status !== 429).length;

      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      console.log(`\n  [Stress-34] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-34] 200 OK: ${ok200}, 429 RateLimited: ${rateLimited429}, Other: ${otherErrors}`);
      console.log(`  [Stress-34] Latency — Avg: ${avgDuration}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-34] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // At least some should succeed
      expect(ok200).toBeGreaterThan(0);
      // Should be rate limited
      expect(rateLimited429).toBeGreaterThan(0);
      // OK count should not exceed 100
      expect(ok200).toBeLessThanOrEqual(100);
      // Should complete within reasonable time
      expect(elapsed).toBeLessThan(30000);
    }
  );
});