/**
 * Stress Test 35: tRPC Not Affected by REST Limiter
 * tRPC routes are under /trpc, not /api, so they bypass the general limiter
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, post, reqId } from './helpers.mjs';

describe('Stress Test 35: tRPC Not Affected by REST Limiter', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should not rate-limit tRPC routes when /api/ limiter is exhausted',
    { timeout: 60000 },
    async () => {
      // Phase 1: Exhaust the /api/ rate limit (105 requests)
      let apiRateLimited = 0;
      for (let i = 0; i < 105; i++) {
        const res = await get('/api/health', { 'X-Request-ID': reqId() });
        if (res.status === 429) apiRateLimited++;
      }
      console.log(`  [Stress-35] Exhausted /api/ limiter — 429 count: ${apiRateLimited}`);
      expect(apiRateLimited).toBeGreaterThan(0);

      // Phase 2: tRPC requests should still work
      const trpcResults = [];
      for (let i = 0; i < 30; i++) {
        const res = await post('/trpc/auth.rolesInfo', { json: null }, { 'X-Request-ID': reqId() });
        trpcResults.push(res);
      }

      const trpcOk = trpcResults.filter((r) => r.ok || r.status === 200).length;
      const trpcErrors = trpcResults.filter((r) => r.status === 429).length;

      console.log(`  [Stress-35] tRPC auth.rolesInfo — OK: ${trpcOk}, 429: ${trpcErrors}`);

      // tRPC should not be affected by /api/ limiter
      // (tRPC has no express-rate-limit applied)
      expect(trpcErrors).toBe(0);
      expect(trpcOk).toBeGreaterThan(0);

      // Verify tRPC response has expected shape
      const lastOk = trpcResults.find((r) => r.ok || r.status === 200);
      if (lastOk) {
        const data = lastOk.body?.result?.data;
        console.log(`  [Stress-35] tRPC response has roles: ${!!data?.roles}`);
        expect(data).toHaveProperty('roles');
      }
    }
  );
});