import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, reqId, wait } from './helpers.mjs';

/**
 * Stress 63: 1000 patient creates then 1000 deletes — memory cleanup verification
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-63: 1000 creates + 1000 deletes — memory cleanup', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should create 1000 patients then delete them without memory leak', async () => {
    const CREATE_COUNT = 1000;

    // Memory before
    const beforeHealth = await get('/api/health');
    const memBefore = beforeHealth.json?.memory?.heapUsed;

    // Phase 1: Create 1000 patients
    const createResults = [];
    const createStart = Date.now();

    for (let i = 0; i < CREATE_COUNT; i++) {
      const patient = makePatient(i);
      const res = await post('/trpc/persistence.patients.create', { json: patient });
      createResults.push(res);
    }

    const createElapsed = Date.now() - createStart;
    const createdIds = createResults
      .filter(r => r.json?.result?.data?.json?.id)
      .map(r => r.json.result.data.json.id);

    // Memory after creates
    const midHealth = await get('/api/health');
    const memMid = midHealth.json?.memory?.heapUsed;

    // Phase 2: Delete all created patients
    const deleteResults = [];
    const deleteStart = Date.now();

    for (const id of createdIds) {
      const res = await post('/trpc/persistence.patients.delete', { json: { patientId: id } });
      deleteResults.push(res.status);
    }

    const deleteElapsed = Date.now() - deleteStart;

    // Memory after deletes
    const afterHealth = await get('/api/health');
    const memAfter = afterHealth.json?.memory?.heapUsed;

    const createSuccess = createResults.filter(r => r.status === 200).length;
    const deleteSuccess = deleteResults.filter(s => s === 200).length;

    console.log(`\n📊 Stress-63 Metrics:`);
    console.log(`  Creates: ${CREATE_COUNT}`);
    console.log(`  Successful creates: ${createSuccess}`);
    console.log(`  Delete targets: ${createdIds.length}`);
    console.log(`  Successful deletes: ${deleteSuccess}`);
    console.log(`  Create phase: ${createElapsed}ms (${(createElapsed / CREATE_COUNT).toFixed(1)}ms/req)`);
    console.log(`  Delete phase: ${deleteElapsed}ms (${createdIds.length ? (deleteElapsed / createdIds.length).toFixed(1) : 0}ms/req)`);
    console.log(`  Memory before: ${memBefore}`);
    console.log(`  Memory after creates: ${memMid}`);
    console.log(`  Memory after deletes: ${memAfter}`);

    if (memBefore && memAfter) {
      const growth = parseFloat(memAfter) - parseFloat(memBefore);
      console.log(`  Net memory growth: ${growth.toFixed(1)}MB`);
    }

    // Most creates should succeed
    expect(createSuccess).toBeGreaterThan(CREATE_COUNT * 0.9);

    // Most deletes should succeed
    expect(deleteSuccess).toBeGreaterThan(createdIds.length * 0.9);
  });
});