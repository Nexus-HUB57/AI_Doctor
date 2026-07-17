import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, makePatient, latencyStats } from './helpers.mjs';

describe('Stress 22: Patient Create-Delete Cycles (50 cycles)', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('creates then deletes 50 patients', async () => {
    const N = 50;
    const createLatencies = [];
    const deleteLatencies = [];
    let cyclesComplete = 0;
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const patient = makePatient(5000 + i);

      // Create
      const t0 = performance.now();
      const createRes = await post('/trpc/persistence.patients.create', { json: patient });
      createLatencies.push(performance.now() - t0);

      const id = createRes.body?.result?.data?.json?.id;
      if (!id) { errors++; continue; }

      // Delete
      const t1 = performance.now();
      const deleteRes = await post('/trpc/persistence.patients.delete', { json: { patientId: id } });
      deleteLatencies.push(performance.now() - t1);

      const deleteData = deleteRes.body?.result?.data?.json;
      if (deleteData?.success) cyclesComplete++;
      else errors++;
    }

    const createStats = latencyStats(createLatencies);
    const deleteStats = latencyStats(deleteLatencies);

    console.log(`\n  Patient create+delete ${N} cycles:`);
    console.log(`  create  avg: ${createStats.avg}ms | p95: ${createStats.p95}ms`);
    console.log(`  delete  avg: ${deleteStats.avg}ms | p95: ${deleteStats.p95}ms`);
    console.log(`  cycles_complete: ${cyclesComplete} | errors: ${errors}`);

    expect(cyclesComplete).toBe(N);
    expect(errors).toBe(0);
  }, 120000);
});