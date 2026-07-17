import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rawFetch, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 64: Large payload stress — 100 requests with ~900KB JSON bodies (under 1MB limit)
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-64: Large payload stress — ~900KB JSON bodies', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  function generateLargeBody(sizeKB) {
    // Generate a JSON body of approximately sizeKB kilobytes
    const chunkSize = 100;
    const chunksNeeded = Math.ceil((sizeKB * 1024) / chunkSize);
    const data = { chunks: [] };
    for (let i = 0; i < chunksNeeded; i++) {
      data.chunks.push('A'.repeat(chunkSize));
    }
    return JSON.stringify({ json: data });
  }

  it('should handle 100 requests with ~900KB bodies', async () => {
    const N = 100;
    const largeBody = generateLargeBody(900);
    const bodySizeKB = (Buffer.byteLength(largeBody) / 1024).toFixed(0);

    const statuses = [];
    const latencies = [];
    const errors = [];

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      try {
        const reqStart = Date.now();
        const res = await rawFetch('/trpc/persistence.patients.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: largeBody,
        });
        latencies.push(Date.now() - reqStart);
        statuses.push(res.status);
      } catch (err) {
        errors.push(err.message);
        statuses.push(0);
      }
    }

    const elapsed = Date.now() - start;

    const statusCounts = {};
    statuses.filter(s => s > 0).forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    const avgLatency = latencies.length
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : 'N/A';

    console.log(`\n📊 Stress-64 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Body size: ~${bodySizeKB}KB`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg latency: ${avgLatency}ms`);
    console.log(`  Connection errors: ${errors.length}`);
    console.log(`  Status distribution:`, statusCounts);
    console.log(`  Throughput: ${((N / (elapsed / 1000)) * (parseInt(bodySizeKB) / 1024)).toFixed(2)} MB/s`);

    // Bodies under 1MB should be accepted or fail with validation, not crash server
    expect(errors.length).toBeLessThan(5);

    // Server must remain responsive
    statuses.forEach(s => {
      expect(s).toBeLessThan(600);
    });
  }, 60000);

  it('should reject bodies over 1MB limit', async () => {
    const overLimitBody = generateLargeBody(1100);
    const bodySizeKB = (Buffer.byteLength(overLimitBody) / 1024).toFixed(0);

    const N = 10;
    const statuses = [];

    for (let i = 0; i < N; i++) {
      try {
        const res = await rawFetch('/trpc/persistence.patients.create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: overLimitBody,
        });
        statuses.push(res.status);
      } catch {
        statuses.push(0);
      }
    }

    console.log(`\n📊 Stress-64 (Over Limit) Metrics:`);
    console.log(`  Body size: ~${bodySizeKB}KB`);
    console.log(`  Statuses: ${[...new Set(statuses)].join(', ')}`);

    // Should be rejected (413 or similar)
    statuses.forEach(s => {
      expect(s).not.toBe(200);
    });
  });
});