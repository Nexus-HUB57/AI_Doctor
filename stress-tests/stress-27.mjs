/**
 * Stress Test 27: Rate Limit AI Endpoint
 * Send 25 requests to /api/health (general limiter)
 * The general limiter is 100/15min, so 25 should all pass (under limit).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

const TOTAL = 25;

describe('Stress Test 27: Rate Limit AI Endpoint — 25 requests to /api/health', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should allow 25 requests under the general 100/15min limit',
    { timeout: 60000 },
    async () => {
      const results = [];
      const latencies = [];

      for (let i = 0; i < TOTAL; i++) {
        const start = Date.now();
        const res = await get('/api/health', { 'X-Request-ID': reqId() });
        latencies.push(Date.now() - start);
        results.push(res.status);
      }

      const okCount = results.filter((s) => s === 200).length;
      const rateLimited = results.filter((s) => s === 429).length;
      const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const maxLatency = Math.max(...latencies);

      console.log(`\n  [Stress-27] Total: ${TOTAL}, OK(200): ${okCount}, RateLimited(429): ${rateLimited}`);
      console.log(`  [Stress-27] Avg latency: ${avgLatency}ms, Max latency: ${maxLatency}ms`);

      // All 25 should succeed since we're well under 100 limit
      expect(okCount).toBe(TOTAL);
      expect(rateLimited).toBe(0);
      // Each should respond with healthy status
      // (just check the last one for body shape)
      const lastRes = await get('/api/health', { 'X-Request-ID': reqId() });
      expect(lastRes.body).toHaveProperty('status', 'healthy');
    }
  );
});