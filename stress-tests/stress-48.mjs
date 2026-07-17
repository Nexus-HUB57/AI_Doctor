/**
 * Stress Test 48: Auth Register with Invalid Role — 100 Invalid Role Strings
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 48: Auth Register — 100 invalid role strings', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should reject all 100 registration attempts with invalid roles',
    { timeout: 60000 },
    async () => {
      const invalidRoles = [
        'superadmin', 'root', 'guest', 'manager', 'nurse',
        'PATIENT ', ' Patient', 'PAT1ENT', 'undefined', 'null',
        'admin ', 'doctor!', '@doctor', '123', '', ' ',
        'hacker', 'sudo', 'system', 'moderator', 'viewer',
        'patient,admin', '["patient"]', '{role:"patient"}',
        'true', 'false', 'NaN', '0', '1',
      ];

      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const role = invalidRoles[i % invalidRoles.length];
        const email = `stress_role_${i}_${Date.now()}@test.com`;
        const res = await post(
          '/trpc/auth.register',
          {
            json: {
              email,
              name: `Test User ${i}`,
              password: 'password123',
              role,
            },
          },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          role,
          error: res.body?.error?.message || res.body?.result?.error?.message || null,
        });
      }

      const elapsed = Date.now() - start;
      const rejections = results.filter((r) => !r.ok).length;
      const accepted = results.filter((r) => r.ok).length;

      // Categorize
      const enumErrors = results.filter((r) =>
        r.error && (r.error.includes('enum') || r.error.includes('Invalid'))
      ).length;
      const otherErrors = rejections - enumErrors;

      console.log(`\n  [Stress-48] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-48] Rejected: ${rejections}, Accepted: ${accepted}`);
      console.log(`  [Stress-48] Enum validation errors: ${enumErrors}, Other: ${otherErrors}`);
      console.log(`  [Stress-48] Avg latency: ${Math.round(elapsed / TOTAL)}ms`);

      // No invalid role should be accepted
      expect(accepted).toBe(0);
      expect(rejections).toBe(TOTAL);
    }
  );
});