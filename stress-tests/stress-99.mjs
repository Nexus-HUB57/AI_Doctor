/**
 * Stress Test 99: Resource Exhaustion
 * Fill in-memory stores with 1000 records, verify performance
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait, percentile } from './helpers.mjs';

describe('STRESS-99: Resource Exhaustion — 1000 records, verify performance', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should maintain performance with 1000 patient records created', async () => {
    const CREATE_COUNT = 1000;
    const PREFIX = 'exhaustion-';
    const createDurations = [];
    let createErrors = 0;

    // Baseline: measure list performance before
    const beforeList = await get('/trpc/persistence.patients.list');
    const beforeListDur = beforeList.duration;
    const beforeCount = Array.isArray(beforeList.body?.result?.data?.json)
      ? beforeList.body.result.data.json.length : 0;
    console.log(`  Baseline: ${beforeCount} patients, list in ${beforeListDur}ms`);

    // Phase 1: Create 1000 patients (sequentially to avoid ID collision)
    console.log(`\n  Phase 1: Creating ${CREATE_COUNT} patients...`);
    const createStart = Date.now();

    // Do in batches of 10 for progress
    for (let i = 0; i < CREATE_COUNT; i++) {
      const p = makePatient(i);
      p.name = `${PREFIX}${p.name}`;
      p.email = `${PREFIX}${p.email}`;

      const t0 = Date.now();
      const res = await post('/trpc/persistence.patients.create', { json: p });
      createDurations.push(Date.now() - t0);

      if (res.status !== 200) createErrors++;

      if ((i + 1) % 200 === 0) {
        const elapsed = Date.now() - createStart;
        const rate = (i + 1) / (elapsed / 1000);
        console.log(`    ${i + 1}/${CREATE_COUNT} created (${rate.toFixed(1)} rec/s)`);
      }
    }

    const createTotal = Date.now() - createStart;
    console.log(`  Created ${CREATE_COUNT - createErrors}/${CREATE_COUNT} in ${createTotal}ms`);

    // Phase 2: Measure list performance after (should not be dramatically slower)
    console.log(`\n  Phase 2: Measuring read performance after fill...`);
    const listDurations = [];
    for (let i = 0; i < 10; i++) {
      const t0 = Date.now();
      const list = await get('/trpc/persistence.patients.list');
      listDurations.push(Date.now() - t0);

      const count = Array.isArray(list.body?.result?.data?.json)
        ? list.body.result.data.json.length : 0;

      if (i === 0) {
        console.log(`  Post-fill patient count: ${count}`);
      }
    }

    const avgListDur = listDurations.reduce((a, b) => a + b, 0) / listDurations.length;
    const slowDown = beforeListDur > 0 ? (avgListDur / beforeListDur).toFixed(1) : 'N/A';

    // Phase 3: Quick single-item reads
    console.log(`\n  Phase 3: Single-item read performance...`);
    const getDurations = [];
    for (let i = 0; i < 50; i++) {
      const t0 = Date.now();
      await get(`/trpc/persistence.patients.getById?input=${encodeURIComponent(JSON.stringify({ patientId: `nonexistent-${i}` }))}`);
      getDurations.push(Date.now() - t0);
    }
    const avgGetDur = getDurations.reduce((a, b) => a + b, 0) / getDurations.length;

    // Results
    console.log(`\n  === Resource Exhaustion Results ===`);
    console.log(`  Create rate: ${(CREATE_COUNT / (createTotal / 1000)).toFixed(1)} rec/s`);
    console.log(`  Create errors: ${createErrors}`);
    console.log(`  List latency before: ${beforeListDur}ms`);
    console.log(`  List latency after (avg 10): ${avgListDur.toFixed(0)}ms`);
    console.log(`  Slowdown factor: ${slowDown}x`);
    console.log(`  Single-item read (avg 50): ${avgGetDur.toFixed(0)}ms`);

    printMetrics('Create Operations', createDurations, createErrors, CREATE_COUNT);
    printMetrics('List Operations (post-fill)', listDurations, 0, 10);

    // Assertions
    expect(createErrors).toBeLessThan(CREATE_COUNT * 0.05); // <5% error
    // List should still respond within 5 seconds
    expect(avgListDur).toBeLessThan(5000);
    // Single-item reads should be fast
    expect(avgGetDur).toBeLessThan(500);

    // Server healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});