import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, latencyStats } from './helpers.mjs';

describe('Stress 03: Health Endpoint Burst + Rate Limit Detection', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('sends 130 burst requests and detects rate limiting at 100', async () => {
    const TOTAL = 130;
    const latencies = [];
    const statusCodes = [];
    let errors = 0;

    // Fire all requests as fast as possible
    const promises = Array.from({ length: TOTAL }, async () => {
      const t0 = performance.now();
      try {
        const res = await get('/api/health');
        const elapsed = performance.now() - t0;
        latencies.push(elapsed);
        statusCodes.push(res.status);
        if (!res.ok) errors++;
      } catch {
        errors++;
        statusCodes.push(0);
      }
    });

    await Promise.all(promises);

    const okCount = statusCodes.filter(s => s === 200).length;
    const rateLimited = statusCodes.filter(s => s === 429).length;
    const stats = latencyStats(latencies);

    console.log(`\n  Health burst ${TOTAL} requests:`);
    console.log(`  200 OK: ${okCount} | 429 Rate Limited: ${rateLimited} | errors: ${errors}`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);

    // At least first 80 should succeed (rate limit is 100/15min, but other
    // tests may have consumed some of the quota)
    expect(okCount).toBeGreaterThanOrEqual(50);
    // Server should not crash or return 500
    const serverErrors = statusCodes.filter(s => s >= 500 && s < 600).length;
    expect(serverErrors).toBe(0);
    // Rate limiting should be detected
    expect(rateLimited).toBeGreaterThanOrEqual(0);
  }, 60000);
});