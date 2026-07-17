import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, get, latencyStats } from './helpers.mjs';

describe('Stress 16: Auth rolesInfo Public Endpoint', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('calls /trpc/auth.rolesInfo 500 times (no auth needed)', async () => {
    const N = 500;
    const latencies = [];
    let validResponses = 0;
    let errors = 0;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await get('/trpc/auth.rolesInfo');
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;

        if (data?.roles && data.roles.patient && data.roles.doctor && data.roles.researcher && data.roles.admin) {
          validResponses++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  rolesInfo ${N} sequential:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  valid: ${validResponses} | errors: ${errors}`);

    expect(validResponses).toBe(N);
    expect(errors).toBe(0);
    expect(parseFloat(stats.p95)).toBeLessThan(50);
  }, 60000);
});