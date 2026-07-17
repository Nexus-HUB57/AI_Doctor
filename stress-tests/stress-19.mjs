import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, get, makePatient, latencyStats } from './helpers.mjs';

describe('Stress 19: Patient List After Bulk Create', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('creates 100 patients then lists them', async () => {
    const CREATE_N = 100;
    const createdIds = [];

    // Bulk create
    for (let i = 0; i < CREATE_N; i++) {
      const patient = makePatient(3000 + i);
      const res = await post('/trpc/persistence.patients.create', { json: patient });
      const data = res.body?.result?.data?.json;
      if (data?.id) createdIds.push(data.id);
    }

    expect(createdIds.length).toBe(CREATE_N);

    // List patients
    const listLatencies = [];
    const LIST_N = 50;

    for (let i = 0; i < LIST_N; i++) {
      const t0 = performance.now();
      const res = await get('/trpc/persistence.patients.list');
      listLatencies.push(performance.now() - t0);
    }

    const stats = latencyStats(listLatencies);
    const lastList = await get('/trpc/persistence.patients.list');
    const patients = lastList.body?.result?.data?.json;

    console.log(`\n  Patient list after ${CREATE_N} creates:`);
    console.log(`  created: ${createdIds.length}`);
    console.log(`  list returned: ${Array.isArray(patients) ? patients.length : 'non-array'}`);
    console.log(`  list ${LIST_N} calls avg: ${stats.avg}ms | p95: ${stats.p95}ms`);

    expect(Array.isArray(patients)).toBe(true);
    // Should have at least our 100 created patients (plus any from other tests)
    expect(patients.length).toBeGreaterThanOrEqual(CREATE_N);
  }, 120000);
});