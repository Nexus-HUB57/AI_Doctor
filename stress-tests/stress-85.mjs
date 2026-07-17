/**
 * Stress Test 85: Read-Heavy Workload
 * 90% reads (health, list, get) + 10% writes, 1000 requests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait, reqId } from './helpers.mjs';

describe('STRESS-85: Read-Heavy Workload — 90% reads, 1000 requests', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 1000 requests with 90% read / 10% write ratio', async () => {
    const TOTAL = 1000;
    const WRITE_RATIO = 0.10;
    const BATCH_SIZE = 100;
    const readDurations = [];
    const writeDurations = [];
    let readErrors = 0;
    let writeErrors = 0;

    const readEndpoints = [
      () => get('/api/health'),
      () => get('/trpc/auth.rolesInfo'),
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getAgentPerformance'),
      () => get('/trpc/persistence.analytics.getTreatmentOutcomes'),
      () => get('/trpc/persistence.analytics.getSpecialtyDistribution'),
      () => get('/trpc/persistence.analytics.getQueryTrends'),
      () => get('/trpc/persistence.analytics.getSystemHealth'),
    ];

    const start = Date.now();

    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
      const batchPromises = Array.from({ length: BATCH_SIZE }, async (i) => {
        const globalIdx = batch * BATCH_SIZE + i;
        const isWrite = Math.random() < WRITE_RATIO;

        const t0 = Date.now();

        if (isWrite) {
          const p = makePatient(globalIdx);
          const res = await post('/trpc/persistence.patients.create', { json: p });
          const dur = Date.now() - t0;
          writeDurations.push(dur);
          if (res.status !== 200) writeErrors++;
        } else {
          const fn = readEndpoints[globalIdx % readEndpoints.length];
          const res = await fn();
          const dur = Date.now() - t0;
          readDurations.push(dur);
          if (res.status !== 200) readErrors++;
        }
      });

      await Promise.all(batchPromises);
    }

    const totalDur = Date.now() - start;
    const totalReads = readDurations.length;
    const totalWrites = writeDurations.length;
    const actualReadPct = (totalReads / TOTAL * 100).toFixed(1);

    console.log(`\n  === Read-Heavy Workload Results ===`);
    console.log(`  Total requests: ${TOTAL}`);
    console.log(`  Reads: ${totalReads} (${actualReadPct}%)`);
    console.log(`  Writes: ${totalWrites} (${(100 - actualReadPct).toFixed(1)}%)`);
    console.log(`  Read errors: ${readErrors}`);
    console.log(`  Write errors: ${writeErrors}`);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(TOTAL / (totalDur / 1000)).toFixed(1)} req/s`);

    if (readDurations.length > 0) {
      printMetrics('Read Operations', readDurations, readErrors, totalReads);
    }
    if (writeDurations.length > 0) {
      printMetrics('Write Operations', writeDurations, writeErrors, totalWrites);
    }

    // At least 95% success rate
    expect(readErrors + writeErrors).toBeLessThan(TOTAL * 0.05);
    // Server still healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});