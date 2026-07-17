/**
 * Stress Test 100: FINAL CHAOS TEST
 * Random endpoints, random order, 500 requests, verify 0 crashes
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait, percentile, reqId } from './helpers.mjs';

describe('STRESS-100: FINAL CHAOS TEST — 500 random requests, 0 crashes', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should survive 500 random endpoint hits with zero connection crashes', async () => {
    const TOTAL = 500;
    const BATCH_SIZE = 50;
    const durations = [];
    const statusCodes = {};
    let connectionCrashes = 0;
    let serverErrors = 0;
    let successes2xx = 0;
    let clientErrors4xx = 0;

    // All available endpoints — mix of safe reads, mutations, and some that will fail
    const allEndpoints = [
      // Safe reads
      () => get('/api/health'),
      () => get('/trpc/auth.rolesInfo'),
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getAgentPerformance'),
      () => get('/trpc/persistence.analytics.getSpecialtyDistribution'),
      () => get('/trpc/persistence.analytics.getTreatmentOutcomes'),
      () => get('/trpc/persistence.analytics.getSystemHealth'),
      () => get('/trpc/persistence.analytics.getQueryTrends'),
      () => get('/trpc/telemedicine.support.getSupportResources', { tumorType: 'lung' }),

      // Mutations — mostly valid
      () => post('/trpc/auth.login', { json: { email: 'patient@example.com', password: 'password123' } }),
      () => post('/trpc/persistence.patients.create', { json: makePatient(Math.floor(Math.random() * 99999)) }),
      () => post('/trpc/persistence.diagnoses.create', { json: { patientId: `chaos-${Date.now()}`, diagnosis: 'Test', tumorType: 'NSCLC', stage: 'II' } }),
      () => post('/trpc/persistence.mutations.create', { json: { patientId: 'chaos-mut', gene: 'TP53', mutationType: 'missense', frequency: 0.45 } }),
      () => post('/trpc/persistence.biomarkers.create', { json: { patientId: 'chaos-bio', biomarkerType: 'PD-L1', value: 75, unit: '%' } }),
      () => post('/trpc/telemedicine.chat.send', { json: { patientId: 'chaos-chat', role: 'patient', content: 'Mensagem de teste' } }),
      () => post('/trpc/telemedicine.support.createSession', { json: { patientId: 'chaos-session' } }),

      // Invalid requests (should produce 4xx, not crash)
      () => post('/trpc/auth.login', { json: {} }),
      () => post('/trpc/persistence.patients.create', { json: { bad: true } }),
      () => post('/trpc/persistence.diagnoses.create', { json: { stage: 'INVALID' } }),
      () => get('/trpc/nonexistent.procedure'),
      () => get('/api/nonexistent-endpoint'),

      // Static/frontend
      () => get('/'),
      () => get('/index.html'),
    ];

    // Shuffle function
    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║     FINAL CHAOS TEST — 500 REQUESTS     ║');
    console.log('  ╚══════════════════════════════════════════╝\n');

    const globalStart = Date.now();

    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
      // Randomize endpoints for each batch
      const batchEndpoints = shuffle(allEndpoints);
      const batchStart = Date.now();

      const results = await Promise.all(
        Array.from({ length: BATCH_SIZE }, async (i) => {
          const ep = batchEndpoints[i % batchEndpoints.length];
          const t0 = Date.now();
          try {
            const res = await ep();
            const dur = Date.now() - t0;
            durations.push(dur);

            const status = res.status;
            statusCodes[status] = (statusCodes[status] || 0) + 1;

            if (status === 0) connectionCrashes++;
            else if (status >= 500) serverErrors++;
            else if (status >= 400) clientErrors4xx++;
            else successes2xx++;

            return { status, dur };
          } catch (err) {
            durations.push(Date.now() - t0);
            connectionCrashes++;
            return { status: 0, error: err.message };
          }
        })
      );

      const batchDur = Date.now() - batchStart;
      const batchCrashes = results.filter(r => r.status === 0).length;
      console.log(`  Batch ${String(batch + 1).padStart(2)}/${TOTAL / BATCH_SIZE}: ${batchDur}ms, crashes=${batchCrashes}, statuses: {${Object.entries(statusCodes).map(([k, v]) => `${k}:${v}`).join(', ')}}`);
    }

    const totalDur = Date.now() - globalStart;

    console.log('\n  ══════════════════════════════════════════');
    console.log('  FINAL CHAOS TEST RESULTS');
    console.log('  ══════════════════════════════════════════');
    printMetrics('CHAOS (500 random requests)', durations, connectionCrashes + serverErrors, TOTAL);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(TOTAL / (totalDur / 1000)).toFixed(1)} req/s`);
    console.log(`  2xx Successes: ${successes2xx}`);
    console.log(`  4xx Client Errors: ${clientErrors4xx}`);
    console.log(`  5xx Server Errors: ${serverErrors}`);
    console.log(`  Connection Crashes: ${connectionCrashes}`);
    console.log(`  Status Distribution: ${JSON.stringify(statusCodes)}`);
    console.log('  ══════════════════════════════════════════\n');

    // PRIMARY ASSERTION: Zero connection crashes
    expect(connectionCrashes).toBe(0);
    // Minimal server errors
    expect(serverErrors).toBeLessThan(10);
    // At least 50% should succeed
    expect(successes2xx).toBeGreaterThanOrEqual(Math.floor(TOTAL * 0.5));

    // Final health check — THE server must still be alive
    const health = await get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('healthy');
    console.log('  🏆 SERVER SURVIVED THE CHAOS — HEALTHY AND OPERATIONAL\n');
  });
});