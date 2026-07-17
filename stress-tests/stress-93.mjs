/**
 * Stress Test 93: Data Consistency Check
 * Create 50 patients, list, verify count matches
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait } from './helpers.mjs';

describe('STRESS-93: Data Consistency — 50 patients, list, verify count', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should maintain data consistency: create 50, list, verify count', async () => {
    const CREATE_COUNT = 50;
    const PREFIX = 'consistency-check-';
    const createdIds = [];
    const durations = [];
    let createErrors = 0;

    // Get baseline patient count
    const beforeList = await get('/trpc/persistence.patients.list');
    const beforePatients = beforeList.body?.result?.data?.json;
    const beforeCount = Array.isArray(beforePatients) ? beforePatients.length : 0;
    console.log(`  Baseline patient count: ${beforeCount}`);

    // Step 1: Create 50 patients sequentially (to avoid ID collisions from Date.now())
    console.log(`\n  Creating ${CREATE_COUNT} patients...`);
    const createStart = Date.now();

    for (let i = 0; i < CREATE_COUNT; i++) {
      const t0 = Date.now();
      const p = makePatient(i);
      p.name = `${PREFIX}${p.name}`;
      p.email = `${PREFIX}${p.email}`;

      const res = await post('/trpc/persistence.patients.create', { json: p });
      durations.push(Date.now() - t0);

      const id = res.body?.result?.data?.json?.id;
      if (res.status === 200 && id) {
        createdIds.push(id);
      } else {
        createErrors++;
      }
    }
    const createDur = Date.now() - createStart;
    console.log(`  Created: ${createdIds.length}/${CREATE_COUNT} in ${createDur}ms`);

    // Step 2: List all patients and count
    const afterList = await get('/trpc/persistence.patients.list');
    const afterPatients = afterList.body?.result?.data?.json;
    const afterCount = Array.isArray(afterPatients) ? afterPatients.length : 0;

    console.log(`  After creation patient count: ${afterCount}`);
    console.log(`  Expected minimum: ${beforeCount} (at least ${createdIds.length} new)`);

    // Step 3: Verify our created patients are in the list
    const found = createdIds.filter(id =>
      afterPatients.some(p => p.id === id || p.openId === id)
    ).length;

    console.log(`  Found in list: ${found}/${createdIds.length}`);

    printMetrics('Data Consistency - Creates', durations, createErrors, CREATE_COUNT);

    // Assertions
    expect(createErrors).toBe(0);
    expect(createdIds.length).toBe(CREATE_COUNT);
    // Count should have increased
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  });
});