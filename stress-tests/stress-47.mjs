/**
 * Stress Test 47: Auth Login with Empty Password — 100 Empty Password Attempts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 100;

describe('Stress Test 47: Auth Login — 100 empty password attempts', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should reject all 100 login attempts with empty/short passwords',
    { timeout: 60000 },
    async () => {
      const badPasswords = ['', 'a', 'ab', 'abc', 'abcde', '12345', '   ', '\t'];

      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const password = badPasswords[i % badPasswords.length];
        const res = await post(
          '/trpc/auth.login',
          { json: { email: 'patient@example.com', password } },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          password: password === '' ? '(empty)' : JSON.stringify(password),
          error: res.body?.error?.message || res.body?.result?.error?.message || null,
        });
      }

      const elapsed = Date.now() - start;
      const rejections = results.filter((r) => !r.ok).length;
      const accepted = results.filter((r) => r.ok).length;
      const durations = results.map((r) => r.duration || 0);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

      // Categorize errors
      const minLenErrors = results.filter((r) =>
        r.error && (r.error.includes('mínimo') || r.error.includes('min'))
      ).length;
      const credErrors = results.filter((r) =>
        r.error && r.error.includes('Email ou senha')
      ).length;

      console.log(`\n  [Stress-47] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-47] Rejected: ${rejections}, Accepted: ${accepted}`);
      console.log(`  [Stress-47] Min-length validation errors: ${minLenErrors}`);
      console.log(`  [Stress-47] Credential errors: ${credErrors}`);
      console.log(`  [Stress-47] Avg latency: ${avgDuration}ms`);

      // None should succeed with bad passwords
      expect(accepted).toBe(0);
      expect(rejections).toBe(TOTAL);
    }
  );
});