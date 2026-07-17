import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer, makePatient, wait } from './helpers.mjs';

/**
 * Stress 65: Concurrent mixed workload — 10s sustained mixed requests
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-65: Concurrent mixed workload — 10s sustained', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  async function worker(id, endTime) {
    const results = { gets: 0, posts: 0, errors: 0 };
    while (Date.now() < endTime) {
      try {
        const op = Math.random();
        if (op < 0.5) {
          // GET health check
          const res = await get('/api/health');
          results.gets++;
        } else if (op < 0.8) {
          // POST patient create
          const patient = makePatient(id * 1000 + results.posts);
          const res = await post('/trpc/persistence.patients.create', { json: patient });
          results.posts++;
        } else {
          // GET auth rolesInfo
          const res = await get('/trpc/auth.rolesInfo');
          results.gets++;
        }
      } catch {
        results.errors++;
      }
    }
    return results;
  }

  it('should sustain mixed concurrent workload for 10 seconds', async () => {
    const CONCURRENCY = 10;
    const DURATION_MS = 10000;
    const endTime = Date.now() + DURATION_MS;

    // Memory before
    const beforeHealth = await get('/api/health');
    const memBefore = beforeHealth.json?.memory?.heapUsed;

    const start = Date.now();
    const workerPromises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      workerPromises.push(worker(i, endTime));
    }
    const workerResults = await Promise.all(workerPromises);
    const elapsed = Date.now() - start;

    // Memory after
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory?.heapUsed;

    const totals = workerResults.reduce((acc, r) => ({
      gets: acc.gets + r.gets,
      posts: acc.posts + r.posts,
      errors: acc.errors + r.errors,
    }), { gets: 0, posts: 0, errors: 0 });

    const totalOps = totals.gets + totals.posts;
    const throughput = (totalOps / (elapsed / 1000)).toFixed(1);
    const errorRate = totalOps > 0 ? ((totals.errors / totalOps) * 100).toFixed(2) : 0;

    console.log(`\n📊 Stress-65 Metrics:`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Duration: ${elapsed}ms`);
    console.log(`  Total GETs: ${totals.gets}`);
    console.log(`  Total POSTs: ${totals.posts}`);
    console.log(`  Errors: ${totals.errors}`);
    console.log(`  Total ops: ${totalOps}`);
    console.log(`  Throughput: ${throughput} ops/s`);
    console.log(`  Error rate: ${errorRate}%`);
    console.log(`  Memory before: ${memBefore}`);
    console.log(`  Memory after: ${memAfter}`);

    // Should complete significant number of operations
    expect(totalOps).toBeGreaterThan(100);

    // Error rate should be low
    expect(Number(errorRate)).toBeLessThan(10);

    // Duration should be approximately 10s
    expect(elapsed).toBeGreaterThan(9000);
    expect(elapsed).toBeLessThan(15000);
  });
});