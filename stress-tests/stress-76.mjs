/**
 * Stress Test 76: tRPC Batch Error
 * Send multiple invalid inputs in rapid succession via tRPC mutations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, wait, printMetrics, reqId } from './helpers.mjs';

describe('STRESS-76: tRPC Batch Error — multiple invalid inputs in rapid succession', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 50 invalid tRPC mutation requests rapidly and return structured errors', { timeout: 60000 }, async () => {
    const N = 50;
    const durations = [];
    let errorCount = 0;
    let validErrorResponses = 0;
    const statusCodes = {};

    const invalidPayloads = [
      // Missing required fields for auth.login
      { json: {} },
      { json: { email: 'not-an-email' } },
      { json: { password: 12345 } },
      { json: { email: '', password: '' } },
      // Invalid types for persistence.patients.create
      { json: { name: 123, age: 'not-a-number', email: 'bad' } },
      { json: { name: '', age: -5, email: 'x' } },
      { json: null },
      { json: { unknownField: true } },
      // Invalid diagnosis
      { json: { patientId: 999, stage: 'invalid_stage_value' } },
      // Malformed JSON scenarios — tRPC should still parse the envelope
      { json: { name: 'A'.repeat(10000) } },
      { json: { email: 'x@' } },
      { json: { role: 'nonexistent_role' } },
    ];

    const procedures = [
      'auth.login',
      'auth.register',
      'persistence.patients.create',
      'persistence.diagnoses.create',
      'persistence.patients.update',
      'telemedicine.chat.send',
      'persistence.treatments.create',
    ];

    const start = Date.now();
    const promises = Array.from({ length: N }, async (i) => {
      const proc = procedures[i % procedures.length];
      const payload = invalidPayloads[i % invalidPayloads.length];
      const t0 = Date.now();
      const res = await post(`/trpc/${proc}`, payload);
      const dur = Date.now() - t0;
      durations.push(dur);

      statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;

      if (res.status >= 400 || (res.body && res.body.error)) {
        errorCount++;
        // Check that error response is structured (not a stack trace leak)
        if (res.body && typeof res.body === 'object') {
          validErrorResponses++;
        }
      }
    });

    await Promise.all(promises);
    const totalDur = Date.now() - start;

    printMetrics('tRPC Batch Error (50 invalid requests)', durations, errorCount, N);

    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(N / (totalDur / 1000)).toFixed(1)} req/s`);
    console.log(`  Status code distribution: ${JSON.stringify(statusCodes)}`);

    // All requests should return a response (not crash the server)
    expect(durations.length).toBe(N);
    // All should be error responses (400 or similar)
    expect(errorCount).toBe(N);
    // All error responses should be structured objects
    expect(validErrorResponses).toBe(N);
    // No response should take more than 2 seconds
    expect(Math.max(...durations)).toBeLessThan(2000);
    // Server should still be healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});