import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, post, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 53: CORS origin rejection — requests with disallowed Origin header
 * Category: Security Headers & Middleware
 */
describe('Stress-53: CORS origin rejection for disallowed origins', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  const DISALLOWED_ORIGINS = [
    'https://evil-site.com',
    'http://malicious.example.org',
    'https://attacker.net',
    'http://phishing.io',
    'http://localhost:9999',
  ];

  it('should reject or not reflect disallowed CORS origins', async () => {
    const N = 50;
    let rejectedCount = 0;
    let reflectedCount = 0;
    const statuses = [];

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const origin = DISALLOWED_ORIGINS[i % DISALLOWED_ORIGINS.length];
      const res = await get('/api/health', { Origin: origin });
      statuses.push(res.status);

      const acao = res.headers['access-control-allow-origin'];
      if (acao === origin) {
        reflectedCount++;
      } else {
        rejectedCount++;
      }
    }

    const elapsed = Date.now() - start;

    console.log(`\n📊 Stress-53 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Origin reflected (bad): ${reflectedCount}`);
    console.log(`  Origin NOT reflected (good): ${rejectedCount}`);
    console.log(`  Status distribution: ${[...new Set(statuses)].join(', ')}`);

    // A disallowed origin should NOT be reflected in Access-Control-Allow-Origin
    expect(reflectedCount).toBe(0);
    expect(rejectedCount).toBe(N);
  });
});