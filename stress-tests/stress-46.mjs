/**
 * Stress Test 46: Auth Login with Invalid Email Format — 100 Malformed Emails
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 46: Auth Login — 100 malformed email attempts', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should reject all 100 login attempts with malformed emails',
    { timeout: 60000 },
    async () => {
      const malformedEmails = [
        'notanemail', '@missinguser.com', 'spaces in@email.com', '',
        'no@tld', 'a@b@c.com', 'user@.com', 'user@domain..com',
        'user@domain.c', 'a'.repeat(300) + '@test.com', 'user name@test.com',
        'user@test..com', 'user@-test.com', 'user@test-.com', '!@#$%@test.com',
      ];

      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const email = malformedEmails[i % malformedEmails.length];
        const res = await post(
          '/trpc/auth.login',
          { json: { email, password: 'password123' } },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          email,
          error: res.body?.error?.message || res.body?.result?.error?.message || null,
        });
      }

      const elapsed = Date.now() - start;
      const rejections = results.filter((r) => !r.ok).length;
      const accepted = results.filter((r) => r.ok).length;
      const durations = results.map((r) => r.duration || 0);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

      // Check error types
      const zodErrors = results.filter((r) =>
        r.error && (r.error.includes('Email') || r.error.includes('email'))
      ).length;
      const authErrors = results.filter((r) =>
        r.error && r.error.includes('Email ou senha')
      ).length;

      console.log(`\n  [Stress-46] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-46] Rejected: ${rejections}, Accepted: ${accepted}`);
      console.log(`  [Stress-46] Zod validation errors: ${zodErrors}`);
      console.log(`  [Stress-46] Auth errors (wrong cred): ${authErrors}`);
      console.log(`  [Stress-46] Avg latency: ${avgDuration}ms`);

      // No malformed email should succeed
      expect(accepted).toBe(0);
      expect(rejections).toBe(TOTAL);
    }
  );
});