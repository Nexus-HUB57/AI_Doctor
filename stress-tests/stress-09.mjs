import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, latencyStats } from './helpers.mjs';

describe('Stress 09: Auth Register Duplicate Detection', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('attempts to register same email 50 times, expects all-after-first to fail', async () => {
    const EMAIL = 's09-duplicate@test.com';
    const N = 50;
    let firstSuccess = false;
    let duplicateErrors = 0;
    let unexpectedErrors = 0;
    const latencies = [];

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await post('/trpc/auth.register', {
          json: { email: EMAIL, name: 'Duplicate User', password: 'password123', role: 'patient' },
        });
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;

        if (i === 0) {
          if (data?.success) firstSuccess = true;
        } else {
          // After first, should get duplicate error
          if (res.status === 200 && data?.success === undefined && res.body?.error) {
            duplicateErrors++;
          } else if (res.body?.error) {
            duplicateErrors++;
          } else if (!data?.success) {
            duplicateErrors++;
          } else {
            unexpectedErrors++;
          }
        }
      } catch {
        unexpectedErrors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Duplicate register ${N} attempts for "${EMAIL}":`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms`);
    console.log(`  first_success: ${firstSuccess}`);
    console.log(`  duplicate_errors: ${duplicateErrors}/${N - 1}`);
    console.log(`  unexpected: ${unexpectedErrors}`);

    expect(firstSuccess).toBe(true);
    expect(duplicateErrors).toBe(N - 1);
    expect(unexpectedErrors).toBe(0);
  }, 120000);
});