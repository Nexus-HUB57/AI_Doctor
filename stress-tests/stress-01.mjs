import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, wait, latencyStats } from './helpers.mjs';

describe('Stress 01: Health Endpoint Baseline Throughput', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('handles 80 sequential health checks under rate limit', async () => {
    const latencies = [];
    let errors = 0;
    const N = 80; // Stay under 100/15min rate limit

    for (let i = 0; i < N; i++) {
      const start = performance.now();
      try {
        const res = await get('/api/health');
        latencies.push(performance.now() - start);
        if (!res.ok) errors++;
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Health ${N} sequential:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  min: ${stats.min}ms | max: ${stats.max}ms`);
    console.log(`  errors: ${errors}/${N}`);

    expect(errors).toBe(0);
    expect(parseFloat(stats.p95)).toBeLessThan(200);
    expect(parseFloat(stats.avg)).toBeLessThan(100);
  }, 60000);
});