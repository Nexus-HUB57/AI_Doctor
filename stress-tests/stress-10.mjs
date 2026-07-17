import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 10: Auth Register + Login Full Cycle', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('completes 50 register-then-login cycles', async () => {
    const N = 50;
    const regLatencies = [];
    const loginLatencies = [];
    let cyclesOk = 0;
    let cyclesFailed = 0;

    for (let i = 0; i < N; i++) {
      const email = `s10-cycle-${String(i).padStart(3, '0')}@test.com`;

      // Register
      const t0 = performance.now();
      const regRes = await post('/trpc/auth.register', {
        json: { email, name: `Cycle ${i}`, password: 'password123', role: 'patient' },
      });
      regLatencies.push(performance.now() - t0);

      // Login
      const t1 = performance.now();
      const loginRes = await post('/trpc/auth.login', {
        json: { email, password: 'password123' },
      });
      loginLatencies.push(performance.now() - t1);

      const regData = regRes.body?.result?.data?.json;
      const loginData = loginRes.body?.result?.data?.json;

      if (regData?.success && loginData?.success && loginData?.token) {
        cyclesOk++;
      } else {
        cyclesFailed++;
      }
    }

    const regStats = latencyStats(regLatencies);
    const loginStats = latencyStats(loginLatencies);

    console.log(`\n  Register+Login ${N} cycles:`);
    console.log(`  Register  avg: ${regStats.avg}ms | p95: ${regStats.p95}ms | p99: ${regStats.p99}ms`);
    console.log(`  Login     avg: ${loginStats.avg}ms | p95: ${loginStats.p95}ms | p99: ${loginStats.p99}ms`);
    console.log(`  cycles_ok: ${cyclesOk} | failed: ${cyclesFailed}`);

    expect(cyclesOk).toBe(N);
    expect(cyclesFailed).toBe(0);
  }, 120000);
});