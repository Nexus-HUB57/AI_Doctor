import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 07: Auth Login Concurrent (bcrypt CPU)', () => {
  beforeAll(async () => {
    await startServer();
    // Register a user for concurrent login tests
    await post('/trpc/auth.register', {
      json: { email: 's07-concurrent@test.com', name: 'Concurrent Login', password: 'password123', role: 'patient' },
    });
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('handles 50 concurrent login requests', async () => {
    const N = 50;
    const latencies = [];
    let successes = 0;
    let errors = 0;

    const wallStart = performance.now();
    const promises = Array.from({ length: N }, async () => {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/auth.login', {
          json: { email: 's07-concurrent@test.com', password: 'password123' },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;
        if (data?.success && data?.token) successes++;
        else errors++;
      } catch {
        errors++;
      }
    });

    await Promise.all(promises);
    const wallTime = performance.now() - wallStart;
    const stats = latencyStats(latencies);

    console.log(`\n  Login ${N} concurrent (bcrypt):`);
    console.log(`  wall_time: ${wallTime.toFixed(0)}ms`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  successes: ${successes} | errors: ${errors}`);

    expect(successes).toBe(N);
    expect(errors).toBe(0);
  }, 120000);
});