/**
 * Stress Test 38: tRPC auth.register 50 Sequential Unique Registrations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 50;

describe('Stress Test 38: tRPC auth.register — 50 sequential unique registrations', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should successfully register 50 unique users sequentially',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const email = `stress_reg_${i}_${Date.now()}@test.com`;
        const res = await post(
          '/trpc/auth.register',
          {
            json: {
              email,
              name: `Stress User ${i}`,
              password: 'password123',
              role: 'patient',
            },
          },
          { 'X-Request-ID': reqId() }
        );
        results.push({
          status: res.status,
          ok: res.ok,
          duration: res.duration,
          email,
          hasToken: !!res.body?.result?.data?.token,
        });
      }

      const elapsed = Date.now() - start;
      const successes = results.filter((r) => r.ok && r.hasToken).length;
      const duplicates = results.filter((r) => !r.ok).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      const maxDuration = Math.max(...durations);

      console.log(`\n  [Stress-38] Total: ${TOTAL}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-38] Registered: ${successes}, Failed/Duplicate: ${duplicates}`);
      console.log(`  [Stress-38] Latency — Avg: ${avgDuration}ms, Max: ${maxDuration}ms`);
      console.log(`  [Stress-38] Throughput: ${Math.round(TOTAL / (elapsed / 1000))} req/s`);

      // Each registration is unique (includes Date.now + index), so all should succeed
      expect(successes).toBe(TOTAL);
      expect(duplicates).toBe(0);

      // Verify the last one has correct shape
      const last = results[results.length - 1];
      expect(last.hasToken).toBe(true);
    }
  );
});