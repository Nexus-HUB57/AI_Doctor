import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, get, registerAndLogin, latencyStats } from './helpers.mjs';

describe('Stress 11: JWT Token Verification (me endpoint)', () => {
  let token;
  beforeAll(async () => {
    await startServer();
    const result = await registerAndLogin('s11-me');
    token = result.token;
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('calls /trpc/auth.me 500 times with valid token', async () => {
    const N = 500;
    const latencies = [];
    let authenticated = 0;
    let errors = 0;

    // Use POST with input for the query (tRPC supports POST for queries too)
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await get('/trpc/auth.me', { Authorization: `Bearer ${token}` });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;
        if (data?.isAuthenticated === true) authenticated++;
        else errors++;
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Auth.me ${N} calls with valid token:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  authenticated: ${authenticated} | errors: ${errors}`);

    expect(authenticated).toBe(N);
    expect(errors).toBe(0);
    // JWT verification should be fast (< 10ms typically)
    expect(parseFloat(stats.p95)).toBeLessThan(50);
  }, 120000);
});