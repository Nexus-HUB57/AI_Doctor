import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rawFetch, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 72: Malformed JSON body — 100 POST requests with broken JSON
 * Category: Error Handling & Resilience
 */
describe('Stress-72: Malformed JSON body — 100 POST requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  const MALFORMED_BODIES = [
    '{broken json',
    '{"key": undefined}',
    '{"key": NaN}',
    '{"key": Infinity}',
    '{trailing comma,}',
    'not json at all',
    '<xml>data</xml>',
    '{"nested": {"broken": true',
    'null',
    '""',
    '{"email":}',
    '{"a":\u0000}',
    Buffer.from('80 81 82', 'hex').toString(), // invalid UTF-8
    '\t\n\r',
    '{"key": "' + 'x'.repeat(100000) + '"}', // very long string value
  ];

  it('should handle 100 malformed JSON bodies without crashing', async () => {
    const N = 100;
    const statuses = [];
    const latencies = [];
    const errors = [];

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const body = MALFORMED_BODIES[i % MALFORMED_BODIES.length];
      try {
        const reqStart = Date.now();
        const res = await rawFetch('/trpc/auth.login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
        });
        latencies.push(Date.now() - reqStart);
        statuses.push(res.status);
      } catch (err) {
        errors.push(err.message);
        statuses.push(0);
      }
    }

    const elapsed = Date.now() - start;

    const statusCounts = {};
    statuses.filter(s => s > 0).forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

    const avgLatency = latencies.length
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : 'N/A';

    console.log(`\n📊 Stress-72 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg latency: ${avgLatency}ms`);
    console.log(`  Connection errors: ${errors.length}`);
    console.log(`  Status distribution:`, statusCounts);

    // Server must not crash — all requests should get HTTP responses
    expect(errors.length).toBeLessThan(5);

    // No 200 OK for malformed JSON
    const okCount = statusCounts[200] || 0;
    console.log(`  Unexpected 200 OK: ${okCount}`);
    expect(okCount).toBeLessThan(N * 0.05);

    // All responses should be valid HTTP
    statuses.filter(s => s > 0).forEach(s => {
      expect(s).toBeGreaterThanOrEqual(400);
    });
  });
});