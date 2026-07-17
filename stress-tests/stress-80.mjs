/**
 * Stress Test 80: Graceful Degradation
 * Send 500 error-causing requests, verify server stays healthy
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-80: Graceful Degradation — 500 error-causing requests, server survives', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should remain healthy after 500 error-inducing requests', async () => {
    const N = 500;
    const durations = [];
    let errorResponses = 0;
    let crashResponses = 0; // status 0 = connection failure

    // All these should produce errors
    const errorPayloads = [
      { proc: 'auth.login', body: { json: { email: 'x@y', password: '' } } },
      { proc: 'auth.login', body: { json: {} } },
      { proc: 'persistence.patients.create', body: { json: { name: '', age: 'x', email: '' } } },
      { proc: 'persistence.diagnoses.create', body: { json: { patientId: 'none' } } },
      { proc: 'telemedicine.chat.send', body: { json: {} } },
      { proc: 'auth.register', body: { json: { email: 'a@b', password: '1' } } },
      { proc: 'persistence.treatments.create', body: { json: { patientId: 'x' } } },
      { proc: 'persistence.mutations.create', body: { json: {} } },
    ];

    // Baseline health
    const healthBefore = await get('/api/health');
    console.log(`  Baseline health status: ${healthBefore.status}`);

    const start = Date.now();
    // Send in batches of 50 to avoid overwhelming
    for (let batch = 0; batch < 10; batch++) {
      const batchStart = Date.now();
      const results = await Promise.all(
        Array.from({ length: 50 }, async (i) => {
          const idx = (batch * 50 + i) % errorPayloads.length;
          const ep = errorPayloads[idx];
          const t0 = Date.now();
          const res = await post(`/trpc/${ep.proc}`, ep.body);
          durations.push(Date.now() - t0);

          if (res.status === 0) {
            crashResponses++;
          } else if (res.status >= 400 || (res.body && res.body.error)) {
            errorResponses++;
          }
          return res.status;
        })
      );
      const batchDur = Date.now() - batchStart;
      console.log(`  Batch ${batch + 1}/10: ${batchDur}ms, statuses: [${new Set(results).join(', ')}]`);
    }
    const totalDur = Date.now() - start;

    printMetrics('Graceful Degradation (500 error requests)', durations, crashResponses, N);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(N / (totalDur / 1000)).toFixed(1)} req/s`);
    console.log(`  Error responses: ${errorResponses}`);
    console.log(`  Connection crashes: ${crashResponses}`);

    // No connection crashes
    expect(crashResponses).toBe(0);
    // Most should return error responses
    expect(errorResponses).toBeGreaterThan(N * 0.8);

    // Final health check — server must be alive
    await wait(500);
    const healthAfter = await get('/api/health');
    console.log(`  Post-stress health status: ${healthAfter.status}`);
    expect(healthAfter.status).toBe(200);
    expect(healthAfter.body.status).toBe('healthy');

    // Quick functional check after abuse
    const rolesInfo = await get('/trpc/auth.rolesInfo');
    expect(rolesInfo.status).toBe(200);
    console.log(`  Post-stress rolesInfo: ${rolesInfo.status} ✓`);
  });
});