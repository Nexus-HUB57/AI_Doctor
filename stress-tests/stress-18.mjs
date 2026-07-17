import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, makePatient } from './helpers.mjs';

describe('Stress 18: Patient Create Concurrent (50 patients)', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('creates 50 patients concurrently via tRPC', async () => {
    const N = 50;
    const wallStart = performance.now();

    const promises = Array.from({ length: N }, async (_, i) => {
      const patient = makePatient(2000 + i); // Offset to avoid collision
      const t0 = performance.now();
      const res = await post('/trpc/persistence.patients.create', { json: patient });
      const latency = performance.now() - t0;
      const data = res.body?.result?.data?.json;
      return { latency, success: !!(data?.id), id: data?.id, name: data?.name };
    });

    const results = await Promise.all(promises);
    const wallTime = performance.now() - wallStart;

    const latencies = results.map(r => r.latency);
    const successes = results.filter(r => r.success);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    console.log(`\n  Patient create ${N} concurrent:`);
    console.log(`  wall_time: ${wallTime.toFixed(0)}ms | avg_latency: ${avg.toFixed(2)}ms`);
    console.log(`  successes: ${successes.length} | failures: ${N - successes.length}`);
    console.log(`  unique_ids: ${new Set(successes.map(s => s.id)).size}`);

    expect(successes.length).toBe(N);
    // All IDs should be unique even under concurrency
    expect(new Set(results.map(r => r.id)).size).toBe(N);
  }, 120000);
});