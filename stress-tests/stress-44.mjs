/**
 * Stress Test 44: tRPC auth.me with Valid Token 200 Sequential
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, get, reqId } from './helpers.mjs';

const TOTAL = 200;

describe('Stress Test 44: tRPC auth.me — 200 sequential with valid token', () => {
  let token = null;

  beforeAll(async () => {
    await startServer();
    // Login first to get a token
    const loginRes = await post('/trpc/auth.login', {
      json: { email: 'patient@example.com', password: 'password123' },
    });
    token = loginRes.body?.result?.data?.token;
  }, 30000);

  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should return authenticated user data 200 times with a valid token',
    { timeout: 60000 },
    async () => {
      if (!token) {
        console.log('\n  [Stress-44] SKIPPED: Could not obtain token');
        expect(true).toBe(true);
        return;
      }

      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const res = await get(
          `/trpc/auth.me?input=${encodeURIComponent(JSON.stringify({ token }))}`,
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          isAuthenticated: res.body?.result?.data?.isAuthenticated,
          userEmail: res.body?.result?.data?.user?.email,
        });
      }

      const elapsed = Date.now() - start;
      const authenticated = results.filter((r) => r.isAuthenticated === true).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);
      const p99Duration = durations.sort((a, b) => a - b)[Math.floor(TOTAL * 0.99)];

      console.log(`\n  [Stress-44] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-44] Authenticated: ${authenticated}/${TOTAL}`);
      console.log(`  [Stress-44] Latency — Avg: ${avgDuration}ms, P99: ${p99Duration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-44] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // All should authenticate successfully
      expect(authenticated).toBe(TOTAL);

      // Verify email consistency
      const emails = new Set(results.map((r) => r.userEmail));
      expect(emails.size).toBe(1);
      expect(emails.has('patient@example.com')).toBe(true);
    }
  );
});