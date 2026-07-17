import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 24: Mutation + Biomarker Create Bulk', () => {
  let patientIds = [];
  beforeAll(async () => {
    await startServer();
    for (let i = 0; i < 10; i++) {
      const res = await post('/trpc/persistence.patients.create', {
        json: { name: `BioMut Patient ${i}`, age: 35 + i, email: `s24-p${i}@test.com` },
      });
      const id = res.body?.result?.data?.json?.id;
      if (id) patientIds.push(id);
    }
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('creates 100 mutations and 100 biomarkers for 10 patients', async () => {
    const N = 100;
    const genes = ['TP53', 'BRCA1', 'BRCA2', 'EGFR', 'KRAS', 'PIK3CA', 'BRAF', 'ALK', 'ROS1', 'RET'];
    const mutTypes = ['Missense', 'Nonsense', 'Frameshift', 'Splice Site', 'Insertion', 'Deletion'];
    const biomarkerTypes = ['PD-L1', 'TMB', 'MSI', 'HER2', 'ER', 'PR', 'Ki-67', 'ALP', 'LDH', 'CEA'];
    const units = ['%', 'mut/Mb', 'score', 'ng/mL', 'U/L', 'IU/L'];

    // Mutations
    const mutLatencies = [];
    let mutCreated = 0;
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      const res = await post('/trpc/persistence.mutations.create', {
        json: {
          patientId: patientIds[i % patientIds.length],
          gene: genes[i % genes.length],
          mutationType: mutTypes[i % mutTypes.length],
          frequency: Math.random() * 50 + 1,
        },
      });
      mutLatencies.push(performance.now() - t0);
      if (res.body?.result?.data?.json?.id) mutCreated++;
    }

    // Biomarkers
    const bioLatencies = [];
    let bioCreated = 0;
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      const res = await post('/trpc/persistence.biomarkers.create', {
        json: {
          patientId: patientIds[i % patientIds.length],
          biomarkerType: biomarkerTypes[i % biomarkerTypes.length],
          value: Math.round(Math.random() * 100 * 100) / 100,
          unit: units[i % units.length],
        },
      });
      bioLatencies.push(performance.now() - t0);
      if (res.body?.result?.data?.json?.id) bioCreated++;
    }

    const mutStats = latencyStats(mutLatencies);
    const bioStats = latencyStats(bioLatencies);

    console.log(`\n  Mutations ${N} + Biomarkers ${N}:`);
    console.log(`  mutations  avg: ${mutStats.avg}ms | p95: ${mutStats.p95}ms | created: ${mutCreated}`);
    console.log(`  biomarkers avg: ${bioStats.avg}ms | p95: ${bioStats.p95}ms | created: ${bioCreated}`);

    expect(mutCreated).toBe(N);
    expect(bioCreated).toBe(N);
  }, 120000);
});