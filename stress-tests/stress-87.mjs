/**
 * Stress Test 87: Spike Test
 * 0 to 200 concurrent requests in 1 second
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-87: Spike Test — 0 to 200 concurrent in 1s', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle a spike of 200 concurrent requests', async () => {
    const CONCURRENCY = 200;
    const durations = [];
    let errors = 0;

    const endpoints = [
      () => get('/api/health'),
      () => get('/trpc/auth.rolesInfo'),
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getSystemHealth'),
      () => post('/trpc/auth.login', { json: { email: 'patient@example.com', password: 'password123' } }),
    ];

    console.log('  Spiking 200 concurrent requests...');

    const start = Date.now();
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, async (i) => {
        const fn = endpoints[i % endpoints.length];
        const t0 = Date.now();
        const res = await fn();
        const dur = Date.now() - t0;
        durations.push(dur);
        if (res.status !== 200) errors++;
        return { idx: i, status: res.status, dur };
      })
    );
    const totalDur = Date.now() - start;

    // Analyze the ramp: how many completed in first 1 second
    const within1s = durations.filter(d => d <= 1000).length;
    const within2s = durations.filter(d => d <= 2000).length;
    const within5s = durations.filter(d => d <= 5000).length;

    printMetrics('Spike Test (200 concurrent)', durations, errors, CONCURRENCY);
    console.log(`  Spike resolved in: ${totalDur}ms`);
    console.log(`  Completed within 1s: ${within1s}/${CONCURRENCY}`);
    console.log(`  Completed within 2s: ${within2s}/${CONCURRENCY}`);
    console.log(`  Completed within 5s: ${within5s}/${CONCURRENCY}`);

    // At least 70% should complete within 5 seconds
    expect(within5s).toBeGreaterThanOrEqual(Math.floor(CONCURRENCY * 0.7));
    // Error rate should be low
    expect(errors).toBeLessThan(CONCURRENCY * 0.10);

    // Server must still be healthy
    await wait(1000);
    const health = await get('/api/health');
    expect(health.status).toBe(200);
    console.log(`  Post-spike health: ${health.status}`);
  });
});