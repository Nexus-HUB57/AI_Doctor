import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, latencyStats } from './helpers.mjs';

describe('Stress 02: Health Endpoint Concurrent Requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('handles 50 concurrent health checks', async () => {
    const CONCURRENCY = 50;
    const latencies = [];
    let errors = 0;

    const start = performance.now();
    const promises = Array.from({ length: CONCURRENCY }, async (_, i) => {
      const t0 = performance.now();
      try {
        const res = await get('/api/health');
        latencies.push(performance.now() - t0);
        if (!res.ok) errors++;
        return res;
      } catch {
        errors++;
        return null;
      }
    });

    await Promise.all(promises);
    const totalElapsed = performance.now() - start;

    const stats = latencyStats(latencies);

    console.log(`\n  Health ${CONCURRENCY} concurrent:`);
    console.log(`  total_wall: ${totalElapsed.toFixed(0)}ms`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  errors: ${errors}/${CONCURRENCY}`);

    expect(errors).toBe(0);
    expect(latencies.length).toBe(CONCURRENCY);
    // Wall time should be less than CONCURRENCY * avg sequential time
    expect(totalElapsed).toBeLessThan(CONCURRENCY * 100);
  }, 60000);
});