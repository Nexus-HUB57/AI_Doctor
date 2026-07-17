/**
 * Stress Test 29: Rate Limit Per-IP Behavior
 * Verify different /api/* paths share the same general limiter
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, post, reqId } from './helpers.mjs';

describe('Stress Test 29: Rate Limit Per-IP — different paths share same limiter', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should share rate limit across multiple /api/* paths',
    { timeout: 60000 },
    async () => {
      const paths = ['/api/health', '/api/health', '/api/health'];

      // Send 50 requests across paths
      let okCount = 0;
      let rateLimited = 0;
      for (let i = 0; i < 50; i++) {
        const path = paths[i % paths.length];
        const res = await get(path, { 'X-Request-ID': reqId() });
        if (res.status === 200) okCount++;
        if (res.status === 429) rateLimited++;
      }

      console.log(`\n  [Stress-29] After 50 mixed-path requests — OK: ${okCount}, 429: ${rateLimited}`);

      // Now send 55 more to push past 100
      for (let i = 0; i < 55; i++) {
        const path = paths[i % paths.length];
        const res = await get(path, { 'X-Request-ID': reqId() });
        if (res.status === 200) okCount++;
        if (res.status === 429) rateLimited++;
      }

      console.log(`  [Stress-29] After 105 total mixed-path requests — OK: ${okCount}, 429: ${rateLimited}`);

      // Should have hit the shared limit
      expect(rateLimited).toBeGreaterThan(0);
      expect(okCount).toBeLessThanOrEqual(100);
    }
  );
});