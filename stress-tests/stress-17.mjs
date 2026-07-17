import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, makePatient, latencyStats } from './helpers.mjs';

describe('Stress 17: Patient Create Sequential (100 patients)', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('creates 100 patients sequentially via tRPC', async () => {
    const N = 100;
    const latencies = [];
    const createdIds = [];
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const patient = makePatient(i);
      const t0 = performance.now();
      try {
        const res = await post('/trpc/persistence.patients.create', { json: patient });
        latencies.push(performance.now() - t0);

        const data = res.body?.result?.data?.json;
        if (data?.id && data?.name === patient.name) {
          createdIds.push(data.id);
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Patient create ${N} sequential:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  created: ${createdIds.length} | errors: ${errors}`);

    expect(errors).toBe(0);
    expect(createdIds.length).toBe(N);
    // All IDs should be unique
    expect(new Set(createdIds).size).toBe(N);
  }, 120000);
});