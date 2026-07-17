import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 21: Patient Update Stress (100 updates)', () => {
  let patientId;
  beforeAll(async () => {
    await startServer();
    const res = await post('/trpc/persistence.patients.create', {
      json: { name: 'Update Target', age: 30, email: 's21-update@test.com' },
    });
    patientId = res.body?.result?.data?.json?.id;
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('updates the same patient 100 times sequentially', async () => {
    const N = 100;
    const latencies = [];
    let successes = 0;
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/persistence.patients.update', {
          json: {
            id: patientId,
            name: `Updated Patient v${i}`,
            age: 30 + (i % 50),
            email: 's21-update@test.com',
          },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;
        if (data?.name === `Updated Patient v${i}`) successes++;
        else errors++;
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Patient update ${N} sequential:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  successes: ${successes} | errors: ${errors}`);

    expect(successes).toBe(N);
    expect(errors).toBe(0);
  }, 120000);
});