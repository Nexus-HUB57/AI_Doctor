import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 12: Auth Invalid Login Attempts', () => {
  beforeAll(async () => {
    await startServer();
    // Register a user
    await post('/trpc/auth.register', {
      json: { email: 's12-valid@test.com', name: 'Valid User', password: 'correctpass', role: 'patient' },
    });
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('sends 100 wrong-password login attempts', async () => {
    const N = 100;
    const latencies = [];
    let rejected = 0;
    let unexpectedSuccess = 0;
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/auth.login', {
          json: { email: 's12-valid@test.com', password: `wrong${i}` },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;

        if (data?.success && data?.token) {
          unexpectedSuccess++;
        } else {
          rejected++;
        }
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Invalid login ${N} attempts:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  rejected: ${rejected} | unexpected_success: ${unexpectedSuccess} | errors: ${errors}`);

    expect(unexpectedSuccess).toBe(0);
    expect(rejected).toBe(N);
    // Server should not crash under brute-force attempts
    expect(errors).toBe(0);
  }, 120000);
});