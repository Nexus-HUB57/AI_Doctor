/**
 * Stress Test 98: Maximum Concurrent Connections
 * Attempt 500 simultaneous HTTP connections
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, printMetrics, wait, percentile } from './helpers.mjs';

describe('STRESS-98: Maximum Concurrent Connections — 500 simultaneous', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 500 simultaneous HTTP connections', async () => {
    const CONCURRENCY = 500;
    const durations = [];
    let connectionFailures = 0;
    let serverErrors = 0;
    let successes = 0;

    const endpoints = [
      () => get('/api/health'),
      () => get('/trpc/auth.rolesInfo'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getSystemHealth'),
      () => get('/trpc/persistence.analytics.getAgentPerformance'),
      () => get('/trpc/persistence.analytics.getQueryTrends'),
      () => get('/trpc/persistence.analytics.getTreatmentOutcomes'),
    ];

    console.log(`  Launching ${CONCURRENCY} simultaneous connections...`);

    const start = Date.now();
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, async (i) => {
        const fn = endpoints[i % endpoints.length];
        const t0 = Date.now();

        try {
          const res = await Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_30s')), 30000)),
          ]);
          const dur = Date.now() - t0;
          durations.push(dur);

          if (res.status === 0) {
            connectionFailures++;
          } else if (res.status >= 500) {
            serverErrors++;
          } else {
            successes++;
          }

          return { idx: i, status: res.status, dur };
        } catch (err) {
          durations.push(Date.now() - t0);
          if (err.message === 'TIMEOUT_30s') {
            connectionFailures++;
          } else {
            connectionFailures++;
          }
          return { idx: i, error: err.message };
        }
      })
    );
    const totalDur = Date.now() - start;

    const within1s = durations.filter(d => d <= 1000).length;
    const within3s = durations.filter(d => d <= 3000).length;
    const within10s = durations.filter(d => d <= 10000).length;

    printMetrics('Max Concurrent (500)', durations, connectionFailures + serverErrors, CONCURRENCY);
    console.log(`\n  === Connection Analysis ===`);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(CONCURRENCY / (totalDur / 1000)).toFixed(1)} req/s`);
    console.log(`  Successes (2xx-4xx): ${successes}`);
    console.log(`  Server errors (5xx): ${serverErrors}`);
    console.log(`  Connection failures: ${connectionFailures}`);
    console.log(`  Completed within 1s: ${within1s} (${(within1s/CONCURRENCY*100).toFixed(1)}%)`);
    console.log(`  Completed within 3s: ${within3s} (${(within3s/CONCURRENCY*100).toFixed(1)}%)`);
    console.log(`  Completed within 10s: ${within10s} (${(within10s/CONCURRENCY*100).toFixed(1)}%)`);

    // At least 80% should succeed
    expect(successes).toBeGreaterThanOrEqual(Math.floor(CONCURRENCY * 0.80));
    // No more than 5% connection failures
    expect(connectionFailures).toBeLessThan(Math.floor(CONCURRENCY * 0.05));

    // Post-test health
    await wait(1000);
    const health = await get('/api/health');
    expect(health.status).toBe(200);
    console.log(`  Post-crush health: ${health.status}`);
  });
});