import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, wait, latencyStats } from './helpers.mjs';

describe('Stress 04: Health Endpoint Sustained Load', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('sustains 10 req/s for 5 seconds (50 total)', async () => {
    const RATE = 10;      // requests per second
    const DURATION = 5;   // seconds
    const TOTAL = RATE * DURATION;
    const latencies = [];
    let errors = 0;
    const intervalMs = 1000 / RATE;

    for (let batch = 0; batch < DURATION; batch++) {
      const batchStart = performance.now();
      const batchPromises = Array.from({ length: RATE }, async () => {
        const t0 = performance.now();
        try {
          const res = await get('/api/health');
          latencies.push(performance.now() - t0);
          if (!res.ok) errors++;
        } catch {
          errors++;
        }
      });

      await Promise.all(batchPromises);

      // Pace to hit target rate
      const batchElapsed = performance.now() - batchStart;
      if (batchElapsed < intervalMs * RATE) {
        await wait(intervalMs * RATE - batchElapsed);
      }
    }

    const stats = latencyStats(latencies);
    const wallTime = latencies.length > 0 ? 'completed' : 'failed';

    console.log(`\n  Health sustained ${RATE} req/s × ${DURATION}s = ${TOTAL} total:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  errors: ${errors}/${latencies.length}`);
    console.log(`  status: ${wallTime}`);

    expect(errors).toBeLessThanOrEqual(5); // Allow some rate-limited requests
    expect(latencies.length).toBeGreaterThanOrEqual(TOTAL - 10);
  }, 60000);
});