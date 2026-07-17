import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, rawFetch, post, startServer, stopServer, wait } from './helpers.mjs';

/**
 * Stress 74: Server resilience after error burst — 100 errors then verify health
 * Category: Error Handling & Resilience
 */
describe('Stress-74: Server resilience after error burst', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should remain healthy after 100 consecutive error requests', async () => {
    const ERROR_BURST_SIZE = 100;

    // Phase 1: Health check before burst
    const beforeHealth = await get('/api/health');
    expect(beforeHealth.status).toBe(200);
    const memBefore = beforeHealth.json?.memory?.heapUsed;
    console.log(`\n📊 Stress-74: Pre-burst health OK`);

    // Phase 2: Error burst — 100 requests that should all fail
    const errorStatuses = [];
    const start = Date.now();

    for (let i = 0; i < ERROR_BURST_SIZE; i++) {
      if (i % 3 === 0) {
        // 404 endpoint
        const res = await get(`/api/burst-error-${i}`);
        errorStatuses.push(res.status);
      } else if (i % 3 === 1) {
        // Malformed JSON
        const res = await rawFetch('/trpc/auth.login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{broken json',
        });
        errorStatuses.push(res.status);
      } else {
        // Invalid auth
        const res = await post('/trpc/auth.login', {
          json: { email: 'bad', password: 'x' },
        });
        errorStatuses.push(res.status);
      }
    }

    const burstElapsed = Date.now() - start;
    const errorCount = errorStatuses.filter(s => s >= 400).length;

    console.log(`  Error burst: ${ERROR_BURST_SIZE} requests in ${burstElapsed}ms`);
    console.log(`  Error responses: ${errorCount}/${ERROR_BURST_SIZE}`);

    // Phase 3: Verify health after burst
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory?.heapUsed;

    // Phase 4: Run 20 normal requests to verify server is responsive
    const postBurstStatuses = [];
    const postBurstLatencies = [];

    for (let i = 0; i < 20; i++) {
      const reqStart = Date.now();
      const res = await get('/api/health');
      postBurstLatencies.push(Date.now() - reqStart);
      postBurstStatuses.push(res.status);
    }

    const postBurstAvg = postBurstLatencies.reduce((a, b) => a + b, 0) / postBurstLatencies.length;

    console.log(`  Post-burst health: ${afterHealth.status}`);
    console.log(`  Post-burst avg latency: ${postBurstAvg.toFixed(1)}ms`);
    console.log(`  Post-burst all OK: ${postBurstStatuses.every(s => s === 200)}`);
    console.log(`  Memory before: ${memBefore}`);
    console.log(`  Memory after:  ${memAfter}`);

    if (memBefore && memAfter) {
      const growth = parseFloat(memAfter) - parseFloat(memBefore);
      console.log(`  Memory growth: ${growth.toFixed(1)}MB`);
    }

    // Burst should produce mostly errors
    expect(errorCount).toBeGreaterThan(ERROR_BURST_SIZE * 0.8);

    // Server must remain healthy after burst
    expect(afterHealth.status).toBe(200);

    // Post-burst requests should all succeed
    expect(postBurstStatuses.every(s => s === 200)).toBe(true);

    // Post-burst latency should not be degraded
    expect(postBurstAvg).toBeLessThan(500);
  });
});