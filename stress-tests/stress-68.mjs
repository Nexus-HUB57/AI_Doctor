import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 68: Response time degradation under sustained load (first 100 vs last 100)
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-68: Response time degradation measurement', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should not show significant latency degradation between first and last 100 requests', async () => {
    const TOTAL = 200;
    const allLatencies = [];

    const start = Date.now();

    for (let i = 0; i < TOTAL; i++) {
      const reqStart = Date.now();
      const res = await get('/api/health');
      allLatencies.push(Date.now() - reqStart);
    }

    const elapsed = Date.now() - start;

    const first100 = allLatencies.slice(0, 100);
    const last100 = allLatencies.slice(100);

    const avgFirst = first100.reduce((a, b) => a + b, 0) / first100.length;
    const avgLast = last100.reduce((a, b) => a + b, 0) / last100.length;

    const p50First = first100.sort((a, b) => a - b)[49];
    const p50Last = last100.sort((a, b) => a - b)[49];
    const p99First = first100.sort((a, b) => a - b)[98];
    const p99Last = last100.sort((a, b) => a - b)[98];

    const maxFirst = Math.max(...first100);
    const maxLast = Math.max(...last100);

    const degradationRatio = avgFirst > 0 ? avgLast / avgFirst : 1;

    console.log(`\n📊 Stress-68 Metrics:`);
    console.log(`  Total requests: ${TOTAL}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Throughput: ${(TOTAL / (elapsed / 1000)).toFixed(1)} req/s`);
    console.log(`  ── First 100 ──`);
    console.log(`    Avg: ${avgFirst.toFixed(1)}ms`);
    console.log(`    P50: ${p50First}ms`);
    console.log(`    P99: ${p99First}ms`);
    console.log(`    Max: ${maxFirst}ms`);
    console.log(`  ── Last 100 ──`);
    console.log(`    Avg: ${avgLast.toFixed(1)}ms`);
    console.log(`    P50: ${p50Last}ms`);
    console.log(`    P99: ${p99Last}ms`);
    console.log(`    Max: ${maxLast}ms`);
    console.log(`  ── Degradation ──`);
    console.log(`    Avg ratio (last/first): ${degradationRatio.toFixed(2)}x`);
    console.log(`    P99 ratio: ${p99First > 0 ? (p99Last / p99First).toFixed(2) : 'N/A'}x`);

    // Latency should not degrade by more than 5x
    expect(degradationRatio).toBeLessThan(5);

    // P99 should not exceed 2s
    expect(p99Last).toBeLessThan(2000);
  });
});