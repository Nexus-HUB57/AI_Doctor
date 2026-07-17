/**
 * Stress Test 84: Concurrent User Journeys
 * 20 users doing full workflow simultaneously
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait } from './helpers.mjs';

describe('STRESS-84: Concurrent User Journeys — 20 users simultaneously', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 20 concurrent full user journeys', async () => {
    const NUM_USERS = 20;
    const allDurations = [];
    let totalSuccesses = 0;

    const start = Date.now();

    const results = await Promise.all(
      Array.from({ length: NUM_USERS }, async (u) => {
        const journey = { user: u, ok: false, steps: [] };
        const t0 = Date.now();

        try {
          // Register
          const reg = await post('/trpc/auth.register', {
            json: { email: `concurrent.${u}@test.com`, name: `ConcurrentUser${u}`, password: 'password123', role: 'patient' }
          });
          journey.steps.push(reg.status);
          if (reg.status !== 200) { allDurations.push(Date.now() - t0); return journey; }

          // Login
          const login = await post('/trpc/auth.login', {
            json: { email: `concurrent.${u}@test.com`, password: 'password123' }
          });
          journey.steps.push(login.status);
          const token = login.body?.result?.data?.json?.token;

          // Create patient
          const patient = makePatient(u);
          const auth = token ? { Authorization: `Bearer ${token}` } : {};
          const cp = await post('/trpc/persistence.patients.create', { json: patient }, auth);
          journey.steps.push(cp.status);
          const pid = cp.body?.result?.data?.json?.id;

          // Create diagnosis
          const diag = await post('/trpc/persistence.diagnoses.create', {
            json: { patientId: pid, diagnosis: 'Test Diagnosis', tumorType: 'NSCLC', stage: 'II' }
          }, auth);
          journey.steps.push(diag.status);

          // Get patient
          let getPStatus = 'skipped';
          if (pid) {
            const getP = await get(`/trpc/persistence.patients.getById?input=${encodeURIComponent(JSON.stringify({ patientId: pid }))}`, auth);
            getPStatus = getP.status;
          }
          journey.steps.push(getPStatus);

          // Mark success if all steps passed
          journey.ok = journey.steps.every(s => s === 200);
          if (journey.ok) totalSuccesses++;
        } catch (err) {
          journey.error = err.message;
        }

        allDurations.push(Date.now() - t0);
        return journey;
      })
    );

    const totalDur = Date.now() - start;

    console.log('\n  === Concurrent User Journeys ===');
    for (const r of results) {
      const icon = r.ok ? '✓' : '✗';
      console.log(`  User ${String(r.user).padStart(2)}: ${icon} steps=[${r.steps.join(',')}] ${r.totalDuration || '?'}ms`);
    }

    printMetrics('Concurrent Journeys', allDurations, NUM_USERS - totalSuccesses, NUM_USERS);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(NUM_USERS / (totalDur / 1000)).toFixed(1)} users/s`);
    console.log(`  Successful journeys: ${totalSuccesses}/${NUM_USERS}`);

    expect(totalSuccesses).toBeGreaterThanOrEqual(16); // At least 80% success
  });
});