/**
 * Stress Test 78: Timeout Resilience
 * Send 100 rapid requests during simulated delay; verify server recovers
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, wait, printMetrics, trpcPost, trpcGet } from './helpers.mjs';

describe('STRESS-78: Timeout Resilience — 100 rapid requests during load', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 100 rapid concurrent requests without timing out or crashing', async () => {
    const N = 100;
    const durations = [];
    let errors = 0;
    let timeouts = 0;

    // Mix of read endpoints (fast) and heavier endpoints
    const endpoints = [
      () => get('/api/health'),
      () => trpcGet('auth.rolesInfo'),
      () => trpcGet('persistence.patients.list'),
      () => trpcGet('persistence.analytics.getSystemStats'),
      () => trpcGet('persistence.analytics.getAgentPerformance'),
      () => trpcGet('persistence.analytics.getSpecialtyDistribution'),
      () => trpcGet('persistence.analytics.getTreatmentOutcomes'),
      () => trpcGet('persistence.analytics.getQueryTrends'),
      () => trpcGet('telemedicine.support.getSupportResources', { tumorType: 'lung' }),
      () => trpcPost('auth.login', { email: 'patient@example.com', password: 'password123' }),
    ];

    const start = Date.now();

    // Fire all 100 concurrently
    const results = await Promise.all(
      Array.from({ length: N }, async (i) => {
        const fn = endpoints[i % endpoints.length];
        const t0 = Date.now();
        try {
          const res = await Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000)),
          ]);
          const dur = Date.now() - t0;
          durations.push(dur);
          if (res.status === 0 || res.error) {
            errors++;
          }
          return { dur, status: res.status };
        } catch (err) {
          const dur = Date.now() - t0;
          durations.push(dur);
          if (err.message === 'TIMEOUT') timeouts++;
          else errors++;
          return { dur, error: err.message };
        }
      })
    );

    const totalDur = Date.now() - start;

    printMetrics('Timeout Resilience (100 rapid requests)', durations, errors + timeouts, N);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(N / (totalDur / 1000)).toFixed(1)} req/s`);
    console.log(`  Timeouts (>15s): ${timeouts}`);
    console.log(`  Other errors: ${errors}`);

    // At most 5% timeout rate
    expect(timeouts).toBeLessThan(6);
    // All 100 requests got a duration (none hung forever)
    expect(durations.length).toBe(N);

    // Verify server recovered — health check
    const health = await get('/api/health');
    expect(health.status).toBe(200);
    console.log(`  Post-stress health check: ${health.status}`);
  });
});