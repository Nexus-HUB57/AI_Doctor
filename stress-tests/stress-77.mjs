/**
 * Stress Test 77: Partial Failure Resilience
 * Mix valid and invalid requests, verify valid ones succeed
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics } from './helpers.mjs';

describe('STRESS-77: Partial Failure Resilience — valid requests succeed among invalid ones', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should succeed on valid requests even when interleaved with invalid ones', { timeout: 60000 }, async () => {
    const TOTAL = 60; // 30 valid + 30 invalid
    const durations = [];
    let validSuccess = 0;
    let invalidCaught = 0;
    let unexpectedErrors = 0;

    const requests = [];

    for (let i = 0; i < TOTAL; i++) {
      if (i % 2 === 0) {
        // Valid: create a patient
        const p = makePatient(i);
        requests.push({
          type: 'valid',
          proc: 'persistence.patients.create',
          body: p,
          label: `valid-patient-${i}`,
        });
      } else {
        // Invalid: bad input
        requests.push({
          type: 'invalid',
          proc: 'persistence.patients.create',
          body: { json: { name: '', age: 'abc', email: 'not-email' } },
          label: `invalid-${i}`,
        });
      }
    }

    const start = Date.now();
    const results = await Promise.all(requests.map(async (req) => {
      const t0 = Date.now();
      const res = await post(`/trpc/${req.proc}`, req.body);
      const dur = Date.now() - t0;
      durations.push(dur);
      return { ...req, res, dur };
    }));
    const totalDur = Date.now() - start;

    for (const r of results) {
      if (r.type === 'valid') {
        if (r.res.status === 200 && r.res.body && !r.res.body.error) {
          validSuccess++;
        } else {
          unexpectedErrors++;
          console.log(`  UNEXPECTED valid failure [${r.label}]: status=${r.res.status} body=${JSON.stringify(r.res.body).slice(0, 200)}`);
        }
      } else {
        if (r.res.status >= 400 || (r.res.body && r.res.body.error)) {
          invalidCaught++;
        } else {
          unexpectedErrors++;
          console.log(`  UNEXPECTED invalid success [${r.label}]: status=${r.res.status}`);
        }
      }
    }

    printMetrics('Partial Failure Resilience', durations, unexpectedErrors, TOTAL);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Valid successes: ${validSuccess}/30`);
    console.log(`  Invalid caught as errors: ${invalidCaught}/30`);
    console.log(`  Unexpected results: ${unexpectedErrors}`);

    expect(validSuccess).toBeGreaterThanOrEqual(28); // Allow 2 failures for edge cases
    expect(invalidCaught).toBe(30);
    expect(unexpectedErrors).toBeLessThanOrEqual(2);

    // Server still healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});