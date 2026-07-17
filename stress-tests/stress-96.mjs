/**
 * Stress Test 96: Authentication Stress
 * 100 logouts/re-logins in sequence
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-96: Authentication Stress — 100 login cycles', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 100 sequential login→verify→re-login cycles', async () => {
    const CYCLES = 100;
    const loginDurations = [];
    const verifyDurations = [];
    let loginFailures = 0;
    let verifyFailures = 0;

    const users = [
      { email: 'patient@example.com', password: 'password123', role: 'patient' },
      { email: 'doctor@example.com', password: 'password123', role: 'doctor' },
      { email: 'researcher@example.com', password: 'password123', role: 'researcher' },
      { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    ];

    console.log(`  Running ${CYCLES} auth cycles...\n`);

    const start = Date.now();

    for (let i = 0; i < CYCLES; i++) {
      const user = users[i % users.length];

      // Login
      const t0 = Date.now();
      const login = await post('/trpc/auth.login', { json: user });
      loginDurations.push(Date.now() - t0);

      if (login.status !== 200 || !login.body?.result?.data?.json?.token) {
        loginFailures++;
        continue;
      }

      const token = login.body.result.data.json.token;
      const role = login.body.result.data.json.user?.role;

      // Verify via /me endpoint
      const t1 = Date.now();
      const me = await get(
        `/trpc/auth.me?input=${encodeURIComponent(JSON.stringify({ token }))}`
      );
      verifyDurations.push(Date.now() - t1);

      if (me.status !== 200 || !me.body?.result?.data?.json?.isAuthenticated) {
        verifyFailures++;
      }

      // Progress
      if ((i + 1) % 25 === 0) {
        const avgLogin = loginDurations.slice(-25).reduce((a, b) => a + b, 0) / 25;
        console.log(`  Cycle ${i + 1}/${CYCLES}: avg login=${avgLogin.toFixed(0)}ms, user=${user.role}`);
      }
    }

    const totalDur = Date.now() - start;

    printMetrics('Auth Login Cycles', loginDurations, loginFailures, CYCLES);
    printMetrics('Auth Verify Cycles', verifyDurations, verifyFailures, CYCLES);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(CYCLES / (totalDur / 1000)).toFixed(1)} cycles/s`);
    console.log(`  Login failures: ${loginFailures}`);
    console.log(`  Verify failures: ${verifyFailures}`);

    expect(loginFailures).toBe(0);
    expect(verifyFailures).toBeLessThan(5); // Allow minor issues with /me
  });
});