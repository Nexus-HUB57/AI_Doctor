/**
 * Stress Test 79: Error Response Size Consistency
 * Verify error responses don't leak stack traces and are consistently sized
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics } from './helpers.mjs';

describe('STRESS-79: Error Response Size Consistency — no stack trace leaks', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should return compact, safe error responses without stack traces', { timeout: 60000 }, async () => {
    const errorProcedures = [
      { proc: 'auth.login', body: { json: {} } },
      { proc: 'auth.login', body: { json: { email: 'no@body.com', password: 'wrong' } } },
      { proc: 'auth.register', body: { json: { email: 'bad', password: 'x' } } },
      { proc: 'persistence.patients.create', body: { json: { age: -1 } } },
      { proc: 'persistence.patients.getById', body: { json: {} } }, // missing patientId
      { proc: 'persistence.diagnoses.create', body: { json: { stage: 'Z' } } },
      { proc: 'telemedicine.chat.send', body: { json: { role: 'patient' } } }, // missing content, patientId
      { proc: 'persistence.treatments.create', body: { json: { status: 'bogus' } } },
      { proc: 'auth.checkPermission', body: { json: {} } }, // missing permission
      { proc: 'persistence.patients.update', body: { json: { id: 'no-such', name: 123 } } },
    ];

    const N = 50;
    const responseSizes = [];
    const durations = [];
    let hasStackLeak = 0;

    const start = Date.now();
    const results = await Promise.all(
      Array.from({ length: N }, async (i) => {
        const ep = errorProcedures[i % errorProcedures.length];
        const t0 = Date.now();
        const res = await post(`/trpc/${ep.proc}`, ep.body);
        const dur = Date.now() - t0;
        durations.push(dur);

        const bodyStr = JSON.stringify(res.body || '');
        responseSizes.push(bodyStr.length);

        // Check for stack trace indicators
        if (bodyStr.includes('at ') && (bodyStr.includes('.ts:') || bodyStr.includes('.js:') || bodyStr.includes('node_modules'))) {
          hasStackLeak++;
          console.log(`  LEAK detected [${ep.proc}]: ${bodyStr.slice(0, 300)}`);
        }

        return { proc: ep.proc, status: res.status, size: bodyStr.length, body: res.body };
      })
    );
    const totalDur = Date.now() - start;

    printMetrics('Error Response Consistency', durations, 0, N);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Min error response size: ${Math.min(...responseSizes)} bytes`);
    console.log(`  Max error response size: ${Math.max(...responseSizes)} bytes`);
    console.log(`  Avg error response size: ${(responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length).toFixed(0)} bytes`);
    console.log(`  Stack trace leaks detected: ${hasStackLeak}`);

    // No stack trace leaks
    expect(hasStackLeak).toBe(0);
    // Error responses should be reasonably small (< 2KB)
    expect(Math.max(...responseSizes)).toBeLessThan(2048);
    // All should have returned a response
    expect(results.length).toBe(N);
    // Size variance should not be extreme (max < 10x min)
    if (Math.min(...responseSizes) > 0) {
      expect(Math.max(...responseSizes) / Math.min(...responseSizes)).toBeLessThan(10);
    }
  });
});