/**
 * Stress Test 86: Write-Heavy Workload
 * 90% writes (create patient/diagnosis) + 10% reads, 500 requests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait } from './helpers.mjs';

describe('STRESS-86: Write-Heavy Workload — 90% writes, 500 requests', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 500 requests with 90% write / 10% read ratio', async () => {
    const TOTAL = 500;
    const READ_RATIO = 0.10;
    const BATCH_SIZE = 50;
    const readDurations = [];
    const writeDurations = [];
    let readErrors = 0;
    let writeErrors = 0;
    let writeSuccesses = 0;

    const readEndpoints = [
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/api/health'),
    ];

    const start = Date.now();

    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
      const batchPromises = Array.from({ length: BATCH_SIZE }, async (i) => {
        const globalIdx = batch * BATCH_SIZE + i;
        const isRead = Math.random() < READ_RATIO;
        const t0 = Date.now();

        if (isRead) {
          const fn = readEndpoints[globalIdx % readEndpoints.length];
          const res = await fn();
          readDurations.push(Date.now() - t0);
          if (res.status !== 200) readErrors++;
        } else {
          // Alternate between patient and diagnosis writes
          const isPatient = globalIdx % 3 !== 2;
          if (isPatient) {
            const p = makePatient(globalIdx);
            const res = await post('/trpc/persistence.patients.create', { json: p });
            const dur = Date.now() - t0;
            writeDurations.push(dur);
            if (res.status === 200) writeSuccesses++;
            else writeErrors++;
          } else {
            const res = await post('/trpc/persistence.diagnoses.create', {
              json: { patientId: `write-test-${globalIdx}`, diagnosis: 'NSCLC', tumorType: 'NSCLC', stage: 'IIB' }
            });
            const dur = Date.now() - t0;
            writeDurations.push(dur);
            if (res.status === 200) writeSuccesses++;
            else writeErrors++;
          }
        }
      });

      await Promise.all(batchPromises);
      if (batch % 3 === 0) {
        console.log(`  Batch ${batch + 1}/${TOTAL / BATCH_SIZE} complete`);
      }
    }

    const totalDur = Date.now() - start;
    const totalReads = readDurations.length;
    const totalWrites = writeDurations.length;

    console.log(`\n  === Write-Heavy Workload Results ===`);
    console.log(`  Total requests: ${TOTAL}`);
    console.log(`  Reads: ${totalReads} (${(totalReads / TOTAL * 100).toFixed(1)}%)`);
    console.log(`  Writes: ${totalWrites} (${(totalWrites / TOTAL * 100).toFixed(1)}%)`);
    console.log(`  Write successes: ${writeSuccesses}`);
    console.log(`  Write errors: ${writeErrors}`);
    console.log(`  Read errors: ${readErrors}`);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(TOTAL / (totalDur / 1000)).toFixed(1)} req/s`);

    if (readDurations.length > 0) printMetrics('Read Operations', readDurations, readErrors, totalReads);
    if (writeDurations.length > 0) printMetrics('Write Operations', writeDurations, writeErrors, totalWrites);

    // At least 90% success
    expect(readErrors + writeErrors).toBeLessThan(TOTAL * 0.10);
    expect(writeSuccesses).toBeGreaterThan(TOTAL * 0.5);

    // Server healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});