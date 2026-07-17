import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, registerAndLogin, latencyStats } from './helpers.mjs';

describe('Stress 06: Auth Login Sequential (bcrypt CPU)', () => {
  let token;
  beforeAll(async () => {
    await startServer();
    // Register a user first for login tests
    const result = await registerAndLogin('s06');
    token = result.token;
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('handles 100 sequential login requests (bcrypt stress)', async () => {
    // Re-register a dedicated user for this test
    const regRes = await post('/trpc/auth.register', {
      json: { email: 's06-login@test.com', name: 'Login Stress', password: 'password123', role: 'patient' },
    });

    const N = 100;
    const latencies = [];
    let successes = 0;
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/auth.login', {
          json: { email: 's06-login@test.com', password: 'password123' },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;
        if (data?.success && data?.token) successes++;
        else errors++;
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Login ${N} sequential (bcrypt):`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  successes: ${successes} | errors: ${errors}`);
    console.log(`  bcrypt SALT_ROUNDS=10 expected ~50-200ms per login`);

    expect(successes).toBe(N);
    expect(errors).toBe(0);
    // bcrypt with 10 rounds should typically be under 500ms
    expect(parseFloat(stats.p95)).toBeLessThan(1000);
  }, 120000);
});