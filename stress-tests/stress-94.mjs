/**
 * Stress Test 94: Concurrent Read-Write
 * 10 writers + 50 readers simultaneously
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait, percentile } from './helpers.mjs';

describe('STRESS-94: Concurrent Read-Write — 10 writers + 50 readers', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 10 concurrent writers and 50 concurrent readers', async () => {
    const NUM_WRITERS = 10;
    const NUM_READERS = 50;
    const TOTAL = NUM_WRITERS + NUM_READERS;
    const readDurations = [];
    const writeDurations = [];
    let readErrors = 0;
    let writeErrors = 0;
    let writeSuccesses = 0;

    const readEndpoints = [
      () => get('/trpc/persistence.patients.list'),
      () => get('/trpc/persistence.analytics.getSystemStats'),
      () => get('/trpc/persistence.analytics.getAgentPerformance'),
      () => get('/trpc/auth.rolesInfo'),
      () => get('/api/health'),
    ];

    const start = Date.now();

    // Launch all 60 concurrently
    const allPromises = [
      // 10 writers
      ...Array.from({ length: NUM_WRITERS }, async (i) => {
        const p = makePatient(i + 10000);
        const t0 = Date.now();
        const res = await post('/trpc/persistence.patients.create', { json: p });
        const dur = Date.now() - t0;
        writeDurations.push(dur);
        if (res.status === 200) writeSuccesses++;
        else writeErrors++;
      }),
      // 50 readers
      ...Array.from({ length: NUM_READERS }, async (i) => {
        const fn = readEndpoints[i % readEndpoints.length];
        const t0 = Date.now();
        const res = await fn();
        const dur = Date.now() - t0;
        readDurations.push(dur);
        if (res.status !== 200) readErrors++;
      }),
    ];

    await Promise.all(allPromises);
    const totalDur = Date.now() - start;

    console.log(`\n  === Concurrent Read-Write Results ===`);
    console.log(`  Total concurrent: ${TOTAL}`);
    console.log(`  Writers: ${NUM_WRITERS} (${writeSuccesses} succeeded)`);
    console.log(`  Readers: ${NUM_READERS} (${NUM_READERS - readErrors} succeeded)`);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(TOTAL / (totalDur / 1000)).toFixed(1)} req/s`);

    if (readDurations.length > 0) printMetrics('Readers', readDurations, readErrors, NUM_READERS);
    if (writeDurations.length > 0) printMetrics('Writers', writeDurations, writeErrors, NUM_WRITERS);

    // All reads should succeed
    expect(readErrors).toBe(0);
    // At least 80% writes should succeed
    expect(writeSuccesses).toBeGreaterThanOrEqual(Math.floor(NUM_WRITERS * 0.8));

    // Server healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});