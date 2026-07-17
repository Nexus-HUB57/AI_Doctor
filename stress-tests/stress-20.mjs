import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 20: Patient GetById Stress (100 lookups)', () => {
  let patientId;
  beforeAll(async () => {
    await startServer();
    // Create a patient to look up
    const res = await post('/trpc/persistence.patients.create', {
      json: { name: 'Lookup Target', age: 45, email: 's20-lookup@test.com' },
    });
    patientId = res.body?.result?.data?.json?.id;
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('looks up the same patient 100 times', async () => {
    const N = 100;
    const latencies = [];
    let found = 0;
    let notFound = 0;
    let errors = 0;

    // Use POST with input for the query procedure
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/persistence.patients.getById', {
          json: { patientId },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;

        if (data && data.name === 'Lookup Target') {
          found++;
        } else if (data === null) {
          notFound++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Patient getById ${N} lookups for "${patientId}":`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  found: ${found} | not_found: ${notFound} | errors: ${errors}`);

    expect(found).toBe(N);
    expect(errors).toBe(0);
  }, 60000);
});