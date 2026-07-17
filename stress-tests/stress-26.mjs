/**
 * Stress Test 26: Rate Limit General
 * Send 105 requests to /api/ in rapid succession, expect 429 after 100
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, wait, reqId } from './helpers.mjs';

const TOTAL = 105;
const LIMIT = 100;

describe('Stress Test 26: Rate Limit General — 105 requests to /api/', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should return 429 after 100 requests within the 15-min window',
    { timeout: 60000 },
    async () => {
      const results = [];
      for (let i = 0; i < TOTAL; i++) {
        const res = await get('/api/health', { 'X-Request-ID': reqId() });
        results.push(res.status);
      }

      const okCount = results.filter((s) => s === 200).length;
      const rateLimited = results.filter((s) => s === 429).length;

      console.log(`\n  [Stress-26] Total: ${TOTAL}, OK(200): ${okCount}, RateLimited(429): ${rateLimited}`);
      console.log(`  [Stress-26] First 429 at request #: ${results.indexOf(429) >= 0 ? results.indexOf(429) + 1 : 'N/A'}`);

      // At least some requests should succeed
      expect(okCount).toBeGreaterThan(0);
      // After exceeding 100, we should see 429s
      expect(rateLimited).toBeGreaterThan(0);
      // Total OK should not exceed the limit
      expect(okCount).toBeLessThanOrEqual(LIMIT);
      // Some requests must have been rate limited
      expect(okCount + rateLimited).toBe(TOTAL);
    }
  );
});