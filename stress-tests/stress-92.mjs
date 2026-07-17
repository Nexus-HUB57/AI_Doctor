/**
 * Stress Test 92: Mixed Endpoint Types
 * REST + tRPC + static file requests interleaved, 200 total
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, printMetrics, wait, makePatient } from './helpers.mjs';

describe('STRESS-92: Mixed Endpoint Types — REST + tRPC + static, 200 total', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 200 interleaved REST, tRPC, and static requests', async () => {
    const TOTAL = 200;
    const durations = [];
    const byType = { rest: [], trpc: [], static: [] };
    let errors = 0;

    const restEndpoints = [
      () => get('/api/health'),
    ];

    const trpcEndpoints = [
      () => get('/trpc/auth.rolesInfo'),
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getAgentPerformance'),
      () => get('/trpc/persistence.analytics.getSystemHealth'),
      () => post('/trpc/persistence.patients.create', { json: makePatient(Math.floor(Math.random() * 9999)) }),
      () => post('/trpc/persistence.diagnoses.create', { json: { patientId: 'mixed-test', diagnosis: 'Test', tumorType: 'NSCLC', stage: 'I' } }),
      () => post('/trpc/auth.login', { json: { email: 'patient@example.com', password: 'password123' } }),
    ];

    const staticEndpoints = [
      () => get('/'),           // Should return HTML or Vite response
      () => get('/index.html'), // Static file
      () => get('/favicon.ico'),// Usually 404 but fast
    ];

    const allEndpoints = [
      ...restEndpoints.map(fn => ({ type: 'rest', fn })),
      ...trpcEndpoints.map(fn => ({ type: 'trpc', fn })),
      ...staticEndpoints.map(fn => ({ type: 'static', fn })),
    ];

    const start = Date.now();

    // Send in 4 batches of 50
    for (let batch = 0; batch < 4; batch++) {
      const batchResults = await Promise.all(
        Array.from({ length: 50 }, async (i) => {
          const ep = allEndpoints[(batch * 50 + i) % allEndpoints.length];
          const t0 = Date.now();
          const res = await ep.fn();
          const dur = Date.now() - t0;
          durations.push(dur);
          byType[ep.type].push(dur);
          if (res.status === 0) errors++;
          return { type: ep.type, status: res.status, dur };
        })
      );
      console.log(`  Batch ${batch + 1}/4 complete`);
    }

    const totalDur = Date.now() - start;

    console.log(`\n  === Mixed Endpoint Type Results ===`);
    console.log(`  Total: ${TOTAL} requests in ${totalDur}ms`);
    console.log(`  Throughput: ${(TOTAL / (totalDur / 1000)).toFixed(1)} req/s`);
    console.log(`  REST requests: ${byType.rest.length} (${byType.rest.length > 0 ? `avg ${(byType.rest.reduce((a, b) => a + b, 0) / byType.rest.length).toFixed(0)}ms` : 'N/A'})`);
    console.log(`  tRPC requests: ${byType.trpc.length} (${byType.trpc.length > 0 ? `avg ${(byType.trpc.reduce((a, b) => a + b, 0) / byType.trpc.length).toFixed(0)}ms` : 'N/A'})`);
    console.log(`  Static requests: ${byType.static.length} (${byType.static.length > 0 ? `avg ${(byType.static.reduce((a, b) => a + b, 0) / byType.static.length).toFixed(0)}ms` : 'N/A'})`);
    console.log(`  Connection errors: ${errors}`);

    printMetrics('Mixed Endpoints', durations, errors, TOTAL);

    expect(errors).toBe(0);
    expect(durations.length).toBe(TOTAL);

    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});