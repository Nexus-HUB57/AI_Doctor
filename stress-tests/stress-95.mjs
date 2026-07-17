/**
 * Stress Test 95: Full CRUD Lifecycle
 * 50 patients: create → read → update → read → delete → verify gone
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait } from './helpers.mjs';

describe('STRESS-95: Full CRUD Lifecycle — 50 patients create→read→update→read→delete→verify', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should complete full CRUD lifecycle for 50 patients', async () => {
    const N = 50;
    const PREFIX = 'crud-lifecycle-';
    const stepDurations = { create: [], read1: [], update: [], read2: [], delete: [], verify: [] };
    let failures = [];

    for (let i = 0; i < N; i++) {
      const p = makePatient(i);
      p.name = `${PREFIX}${p.name}`;
      p.email = `${PREFIX}${p.email}`;

      // CREATE
      const t0 = Date.now();
      const create = await post('/trpc/persistence.patients.create', { json: p });
      stepDurations.create.push(Date.now() - t0);
      const pid = create.body?.result?.data?.json?.id;

      if (!pid || create.status !== 200) {
        failures.push(`Patient ${i}: create failed (status=${create.status})`);
        continue;
      }

      // READ 1
      const t1 = Date.now();
      const read1 = await get(`/trpc/persistence.patients.getById?input=${encodeURIComponent(JSON.stringify({ patientId: pid }))}`);
      stepDurations.read1.push(Date.now() - t1);

      if (read1.status !== 200) {
        failures.push(`Patient ${i}: read1 failed`);
        continue;
      }

      // UPDATE
      const t2 = Date.now();
      const update = await post('/trpc/persistence.patients.update', {
        json: { ...p, id: pid, name: `${PREFIX}UPDATED-${p.name}` }
      });
      stepDurations.update.push(Date.now() - t2);

      if (update.status !== 200) {
        failures.push(`Patient ${i}: update failed`);
        continue;
      }

      // READ 2 - verify update
      const t3 = Date.now();
      const read2 = await get(`/trpc/persistence.patients.getById?input=${encodeURIComponent(JSON.stringify({ patientId: pid }))}`);
      stepDurations.read2.push(Date.now() - t3);

      const updatedName = read2.body?.result?.data?.json?.name;
      if (read2.status !== 200 || !updatedName?.includes('UPDATED')) {
        failures.push(`Patient ${i}: read2 failed or name not updated (got: ${updatedName})`);
      }

      // DELETE
      const t4 = Date.now();
      const del = await post('/trpc/persistence.patients.delete', { json: { patientId: pid } });
      stepDurations.delete.push(Date.now() - t4);

      if (del.status !== 200) {
        failures.push(`Patient ${i}: delete failed`);
        continue;
      }

      // VERIFY GONE
      const t5 = Date.now();
      const verify = await get(`/trpc/persistence.patients.getById?input=${encodeURIComponent(JSON.stringify({ patientId: pid }))}`);
      stepDurations.verify.push(Date.now() - t5);

      const verifyBody = verify.body?.result?.data?.json;
      if (verifyBody && verifyBody.id) {
        failures.push(`Patient ${i}: still exists after delete`);
      }
    }

    console.log('\n  === CRUD Lifecycle Step Durations ===');
    for (const [step, durs] of Object.entries(stepDurations)) {
      if (durs.length > 0) {
        const avg = (durs.reduce((a, b) => a + b, 0) / durs.length).toFixed(0);
        console.log(`  ${step.padEnd(10)}: ${durs.length} ops, avg ${avg}ms, max ${Math.max(...durs)}ms`);
      }
    }

    console.log(`\n  Failures: ${failures.length}/${N}`);
    if (failures.length > 0 && failures.length <= 10) {
      failures.forEach(f => console.log(`    ${f}`));
    }

    printMetrics('CRUD Lifecycle Total',
      Object.values(stepDurations).flat(),
      0,
      Object.values(stepDurations).reduce((a, b) => a + b.length, 0)
    );

    // At least 80% full lifecycle success
    expect(failures.length).toBeLessThanOrEqual(Math.floor(N * 0.2));
  });
});