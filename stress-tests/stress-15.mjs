import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, latencyStats } from './helpers.mjs';

describe('Stress 15: Auth Me Without Token (unauthenticated)', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('sends 200 unauthenticated /trpc/auth.me requests', async () => {
    const N = 200;
    const latencies = [];
    let unauthenticated = 0;
    let unexpectedAuth = 0;
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        // No Authorization header
        const res = await get('/trpc/auth.me');
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;

        if (data?.isAuthenticated === false && data?.user === null) {
          unauthenticated++;
        } else if (data?.isAuthenticated === true) {
          unexpectedAuth++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Unauthenticated /trpc/auth.me ${N} requests:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  correctly_unauthenticated: ${unauthenticated} | unexpected_auth: ${unexpectedAuth} | errors: ${errors}`);

    expect(unauthenticated).toBe(N);
    expect(unexpectedAuth).toBe(0);
    expect(errors).toBe(0);
    // Should be very fast since no DB/bcrypt involved
    expect(parseFloat(stats.p95)).toBeLessThan(30);
  }, 60000);
});