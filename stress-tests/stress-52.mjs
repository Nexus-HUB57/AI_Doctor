import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rawFetch, startServer, stopServer, wait } from './helpers.mjs';

/**
 * Stress 52: CORS preflight OPTIONS requests — 50 OPTIONS requests
 * Category: Security Headers & Middleware
 */
describe('Stress-52: CORS preflight OPTIONS requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 50 CORS preflight OPTIONS requests', async () => {
    const N = 50;
    const statuses = [];
    const corsHeaders = {
      'access-control-allow-origin': 0,
      'access-control-allow-methods': 0,
      'access-control-allow-headers': 0,
    };

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const res = await rawFetch('/trpc/auth.login', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      statuses.push(res.status);

      for (const h of Object.keys(corsHeaders)) {
        if (res.headers[h]) corsHeaders[h]++;
      }
    }

    const elapsed = Date.now() - start;
    const avgMs = (elapsed / N).toFixed(1);

    console.log(`\n📊 Stress-52 Metrics:`);
    console.log(`  OPTIONS requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg per request: ${avgMs}ms`);
    console.log(`  Status distribution: ${[...new Set(statuses)].join(', ')}`);

    for (const [h, count] of Object.entries(corsHeaders)) {
      console.log(`  ${h}: present in ${count}/${N}`);
    }

    // All preflight requests should get a response (204 or 200)
    statuses.forEach(s => {
      expect(s).toBeLessThan(500);
    });

    // CORS headers should be present on most/all
    expect(corsHeaders['access-control-allow-headers']).toBeGreaterThan(N * 0.9);

    // Performance check
    expect(Number(avgMs)).toBeLessThan(100);
  });
});