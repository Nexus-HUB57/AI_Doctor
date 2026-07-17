import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer, wait, reqId } from './helpers.mjs';

/**
 * Stress 51: Verify Helmet headers present on 100 consecutive requests
 * Category: Security Headers & Middleware
 */
describe('Stress-51: Helmet headers on 100 consecutive requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  const EXPECTED_HEADERS = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'strict-transport-security',
  ];

  it('should have security headers on 100 consecutive health-check requests', async () => {
    const N = 100;
    const missingCounts = {};
    EXPECTED_HEADERS.forEach(h => { missingCounts[h] = 0; });

    const start = Date.now();
    const results = [];

    for (let i = 0; i < N; i++) {
      const res = await get('/api/health');
      results.push(res.status);
      for (const h of EXPECTED_HEADERS) {
        if (!res.headers[h]) {
          missingCounts[h]++;
        }
      }
    }

    const elapsed = Date.now() - start;
    const avgMs = (elapsed / N).toFixed(1);

    console.log(`\n📊 Stress-51 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg per request: ${avgMs}ms`);
    console.log(`  All 200 OK: ${results.every(s => s === 200)}`);

    for (const [h, count] of Object.entries(missingCounts)) {
      console.log(`  ${h}: missing in ${count}/${N} requests`);
    }

    // All requests should succeed
    expect(results.every(s => s === 200)).toBe(true);

    // All expected security headers should be present on every request
    for (const h of EXPECTED_HEADERS) {
      expect(missingCounts[h]).toBe(0);
    }

    // Performance: avg should be under 200ms
    expect(Number(avgMs)).toBeLessThan(200);
  });
});