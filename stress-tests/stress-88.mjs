/**
 * Stress Test 88: Soak Test
 * 100 requests over 30 seconds (3-4 req/s sustained)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-88: Soak Test — 100 requests over 30s sustained', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should sustain ~3-4 req/s for 30 seconds without degradation', async () => {
    const TOTAL = 100;
    const DURATION_MS = 30000;
    const INTERVAL = DURATION_MS / TOTAL; // ~300ms between requests
    const durations = [];
    let errors = 0;
    const timeline = []; // { time, status, dur }

    const endpoints = [
      () => get('/api/health'),
      () => get('/trpc/auth.rolesInfo'),
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getSystemHealth'),
      () => post('/trpc/auth.login', { json: { email: 'patient@example.com', password: 'password123' } }),
      () => get('/trpc/persistence.analytics.getTreatmentOutcomes'),
    ];

    const start = Date.now();

    for (let i = 0; i < TOTAL; i++) {
      const fn = endpoints[i % endpoints.length];
      const t0 = Date.now();
      const res = await fn();
      const dur = Date.now() - t0;
      durations.push(dur);

      const elapsed = Date.now() - start;
      timeline.push({ time: elapsed, status: res.status, dur });

      if (res.status !== 200) errors++;

      // Print progress every 25
      if ((i + 1) % 25 === 0) {
        const recentDurs = durations.slice(-25);
        const avgRecent = recentDurs.reduce((a, b) => a + b, 0) / recentDurs.length;
        console.log(`  [${elapsed}ms] ${i + 1}/${TOTAL} completed, avg latency last 25: ${avgRecent.toFixed(0)}ms`);
      }

      // Wait to maintain target rate
      if (i < TOTAL - 1) {
        const nextAt = start + (i + 1) * INTERVAL;
        const sleepMs = Math.max(0, nextAt - Date.now());
        if (sleepMs > 0) await wait(sleepMs);
      }
    }

    const totalDur = Date.now() - start;

    printMetrics('Soak Test (30s sustained)', durations, errors, TOTAL);
    console.log(`  Total test duration: ${totalDur}ms`);
    console.log(`  Target rate: ~${(TOTAL / (DURATION_MS / 1000)).toFixed(1)} req/s`);
    console.log(`  Actual rate: ${(TOTAL / (totalDur / 1000)).toFixed(1)} req/s`);

    // Check for degradation: compare first quarter vs last quarter
    const q1 = durations.slice(0, 25);
    const q4 = durations.slice(-25);
    const avgQ1 = q1.reduce((a, b) => a + b, 0) / q1.length;
    const avgQ4 = q4.reduce((a, b) => a + b, 0) / q4.length;
    const degradation = ((avgQ4 - avgQ1) / avgQ1 * 100).toFixed(1);

    console.log(`  Q1 avg latency: ${avgQ1.toFixed(0)}ms`);
    console.log(`  Q4 avg latency: ${avgQ4.toFixed(0)}ms`);
    console.log(`  Latency degradation: ${degradation}%`);

    expect(errors).toBe(0);
    // No more than 100% degradation
    expect(parseFloat(degradation)).toBeLessThan(100);
  });
});