import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 08: Auth Register Sequential (100 unique users)', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('registers 100 unique users sequentially', async () => {
    const N = 100;
    const latencies = [];
    let successes = 0;
    let duplicates = 0;
    let otherErrors = 0;
    const tokens = [];

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/auth.register', {
          json: {
            email: `s08-user-${String(i).padStart(3, '0')}@test.com`,
            name: `Stress User ${i}`,
            password: 'password123',
            role: 'patient',
          },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;
        if (data?.success && data?.token) {
          successes++;
          tokens.push(data.token);
        } else if (res.body?.error?.message?.includes('já existe')) {
          duplicates++;
        } else {
          otherErrors++;
        }
      } catch {
        otherErrors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Register ${N} sequential:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  successes: ${successes} | duplicates: ${duplicates} | errors: ${otherErrors}`);
    console.log(`  tokens received: ${tokens.length}`);

    // All should succeed since each email is unique
    expect(successes).toBe(N);
    expect(otherErrors).toBe(0);
    // Each response should have a valid token
    tokens.forEach(t => expect(typeof t).toBe('string'));
  }, 120000);
});