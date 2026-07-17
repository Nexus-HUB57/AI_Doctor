import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 23: Diagnosis Create Bulk (100 diagnoses for 10 patients)', () => {
  let patientIds = [];
  beforeAll(async () => {
    await startServer();
    // Create 10 patients
    for (let i = 0; i < 10; i++) {
      const res = await post('/trpc/persistence.patients.create', {
        json: { name: `Diag Patient ${i}`, age: 40 + i, email: `s23-p${i}@test.com` },
      });
      const id = res.body?.result?.data?.json?.id;
      if (id) patientIds.push(id);
    }
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('creates 100 diagnoses distributed across 10 patients', async () => {
    const N = 100;
    const latencies = [];
    let created = 0;
    let errors = 0;

    const tumorTypes = ['Lung Adenocarcinoma', 'Breast Cancer', 'Colorectal', 'Melanoma', 'Prostate'];
    const stages = ['I', 'II', 'III', 'IV'];

    for (let i = 0; i < N; i++) {
      const patientId = patientIds[i % patientIds.length];
      const t0 = performance.now();
      try {
        const res = await post('/trpc/persistence.diagnoses.create', {
          json: {
            patientId,
            patientName: `Diag Patient ${i % 10}`,
            age: 40 + (i % 10),
            diagnosis: `${tumorTypes[i % tumorTypes.length]} Stage ${stages[i % stages.length]}`,
            tumorType: tumorTypes[i % tumorTypes.length],
            stage: i % stages.length,
          },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;
        if (data?.id) created++;
        else errors++;
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Diagnosis create ${N} across ${patientIds.length} patients:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  created: ${created} | errors: ${errors}`);

    expect(created).toBe(N);
    expect(errors).toBe(0);
  }, 120000);
});