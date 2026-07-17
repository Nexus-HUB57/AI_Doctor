/**
 * Stress Test 49: Patient Create with Invalid Data — 100 Invalid Patient Objects
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 49: Patient Create — 100 invalid patient objects', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should reject all 100 patient creates with invalid/malformed data',
    { timeout: 60000 },
    async () => {
      // Generate 100 different invalid patient payloads
      const invalidPatients = [];

      // Missing required fields
      invalidPatients.push({ name: 'No Age' }); // missing age, email
      invalidPatients.push({ age: 30 }); // missing name, email
      invalidPatients.push({ email: 'test@test.com' }); // missing name, age
      invalidPatients.push({}); // empty object
      invalidPatients.push({ name: 'Bad Email', age: 30, email: 'not-email' }); // bad email

      // Wrong types
      invalidPatients.push({ name: 12345, age: 'thirty', email: 'test@test.com' });
      invalidPatients.push({ name: 'Test', age: -5, email: 'test@test.com' }); // negative age
      invalidPatients.push({ name: 'Test', age: 999, email: 'test@test.com' }); // unreasonable age
      invalidPatients.push({ name: '', age: 30, email: 'test@test.com' }); // empty name

      // Extra/malformed fields
      invalidPatients.push({ name: 'Test', age: 30, email: 'test@test.com', __proto__: { isAdmin: true } });
      invalidPatients.push(null);
      invalidPatients.push('not an object');
      invalidPatients.push(42);
      invalidPatients.push([]);

      // Generate remaining by cycling through these
      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const payload = invalidPatients[i % invalidPatients.length];
        const res = await post(
          '/trpc/persistence.patients.create',
          { json: payload },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          payloadType: payload === null ? 'null' : typeof payload,
          error: res.body?.error?.message || res.body?.result?.error?.message || null,
        });
      }

      const elapsed = Date.now() - start;
      const rejections = results.filter((r) => !r.ok).length;
      const accepted = results.filter((r) => r.ok).length;

      // Count error types
      const zodErrors = results.filter((r) => r.error && (
        r.error.includes('Required') || r.error.includes('required') ||
        r.error.includes('email') || r.error.includes('number')
      )).length;

      console.log(`\n  [Stress-49] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-49] Rejected: ${rejections}, Accepted: ${accepted}`);
      console.log(`  [Stress-49] Validation errors: ${zodErrors}`);
      console.log(`  [Stress-49] Avg latency: ${Math.round(elapsed / TOTAL)}ms`);

      // All invalid data should be rejected
      expect(rejections).toBe(TOTAL);
      expect(accepted).toBe(0);
    }
  );
});